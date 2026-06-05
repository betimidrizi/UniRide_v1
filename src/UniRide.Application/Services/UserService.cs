using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class UserService(IRepository<User> users, IMapper mapper) : IUserService
{
    public async Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        return mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto dto, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        user.FullName = dto.FullName.Trim();
        user.University = dto.University.Trim();
        var newPhone = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();
        if (!string.Equals(user.PhoneNumber, newPhone, StringComparison.Ordinal))
        {
            if (newPhone is not null)
            {
                var phoneTaken = await users.Query()
                    .AnyAsync(u => u.UserId != userId && u.PhoneNumber == newPhone, cancellationToken);

                if (phoneTaken)
                    throw new ConflictException("Phone number is already used by another account.");
            }

            user.PhoneNumber = newPhone;
        }

        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> RequestVerificationAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        if (user.IsVerified)
            return mapper.Map<UserProfileDto>(user);

        user.VerificationRequestedAt ??= DateTime.UtcNow;
        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return mapper.Map<UserProfileDto>(user);
    }
}
