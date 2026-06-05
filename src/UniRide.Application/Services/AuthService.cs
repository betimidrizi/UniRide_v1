using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Application.Settings;
using UniRide.Domain.Entities;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class AuthService(
    IRepository<User> users,
    IRepository<RefreshToken> refreshTokens,
    IPasswordHasher hasher,
    IJwtTokenService jwt,
    IOptions<JwtSettings> jwtOptions,
    IOptions<AuthLockoutSettings> lockoutOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;
    private readonly AuthLockoutSettings _lockout = lockoutOptions.Value;

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string? ip, CancellationToken cancellationToken = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var emailTaken = await users.Query()
            .AnyAsync(u => u.Email == email, cancellationToken);

        if (emailTaken)
            throw new ConflictException("An account with that email already exists.");

        var phoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();
        if (phoneNumber is not null)
        {
            var phoneTaken = await users.Query()
                .AnyAsync(u => u.PhoneNumber == phoneNumber, cancellationToken);

            if (phoneTaken)
                throw new ConflictException("An account with that phone number already exists.");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = hasher.Hash(dto.Password),
            University = dto.University.Trim(),
            PhoneNumber = phoneNumber
        };

        await users.AddAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);

        return await IssueTokensAsync(user, ip, cancellationToken);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string? ip, CancellationToken cancellationToken = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await users.Query()
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        // Generic message — do not reveal whether the email exists.
        if (user is null)
            throw new UnauthorizedDomainException("Invalid email or password.");

        if (user.LockedOutUntil.HasValue && user.LockedOutUntil > DateTime.UtcNow)
            throw new UnauthorizedDomainException(
                $"Account is temporarily locked. Try again after {user.LockedOutUntil.Value:u}.");

        if (!hasher.Verify(dto.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= _lockout.MaxFailedAttempts)
            {
                user.LockedOutUntil = DateTime.UtcNow.AddMinutes(_lockout.LockoutMinutes);
                user.FailedLoginAttempts = 0;
            }
            users.Update(user);
            await users.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedDomainException("Invalid email or password.");
        }

        if (user.IsSuspended)
            throw new ForbiddenException("Account is suspended.");

        user.FailedLoginAttempts = 0;
        user.LockedOutUntil = null;
        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return await IssueTokensAsync(user, ip, cancellationToken);
    }

    public async Task<AuthResponseDto> RefreshAsync(string refreshToken, string? ip, CancellationToken cancellationToken = default)
    {
        var existing = await refreshTokens.Query()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == refreshToken, cancellationToken);

        if (existing is null || !existing.IsActive || existing.User is null)
            throw new UnauthorizedDomainException("Invalid or expired refresh token.");

        if (existing.User.IsSuspended)
            throw new ForbiddenException("Account is suspended.");

        // Rotate: revoke the current token, issue a new pair.
        var newRefresh = jwt.CreateRefreshToken();

        existing.RevokedAt = DateTime.UtcNow;
        existing.RevokedByIp = ip;
        existing.ReplacedByToken = newRefresh;
        refreshTokens.Update(existing);

        var entity = new RefreshToken
        {
            UserId = existing.UserId,
            Token = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays),
            CreatedByIp = ip
        };
        await refreshTokens.AddAsync(entity, cancellationToken);
        await refreshTokens.SaveChangesAsync(cancellationToken);

        var access = jwt.CreateAccessToken(existing.User);

        return new AuthResponseDto(
            access.AccessToken,
            newRefresh,
            access.ExpiresAtUtc,
            existing.User.UserId,
            existing.User.Email,
            existing.User.FullName,
            existing.User.Role.ToString());
    }

    public async Task RevokeAsync(string refreshToken, string? ip, CancellationToken cancellationToken = default)
    {
        var existing = await refreshTokens.Query()
            .FirstOrDefaultAsync(t => t.Token == refreshToken, cancellationToken);

        if (existing is null || !existing.IsActive)
            return; // idempotent

        existing.RevokedAt = DateTime.UtcNow;
        existing.RevokedByIp = ip;
        refreshTokens.Update(existing);
        await refreshTokens.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthResponseDto> IssueTokensAsync(User user, string? ip, CancellationToken cancellationToken)
    {
        var access = jwt.CreateAccessToken(user);
        var refresh = jwt.CreateRefreshToken();

        var entity = new RefreshToken
        {
            UserId = user.UserId,
            Token = refresh,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays),
            CreatedByIp = ip
        };
        await refreshTokens.AddAsync(entity, cancellationToken);
        await refreshTokens.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            access.AccessToken,
            refresh,
            access.ExpiresAtUtc,
            user.UserId,
            user.Email,
            user.FullName,
            user.Role.ToString());
    }
}
