using FluentValidation;
using UniRide.Application.DTOs;
using UniRide.Domain.Enums;

namespace UniRide.Application.Validators;

internal static class PhoneNumberValidation
{
    public const string MacedonianMobileMessage = "Phone number must be a valid Macedonian mobile number in the format 07XXXXXXX.";

    public static bool IsMacedonianMobileNumber(string? phoneNumber) =>
        string.IsNullOrWhiteSpace(phoneNumber) ||
        (phoneNumber.Length == 9 &&
        phoneNumber.StartsWith("07") &&
        phoneNumber.All(char.IsDigit));
}

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(120);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");

        RuleFor(x => x.University)
            .NotEmpty().MaximumLength(120);

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32)
            .Must(PhoneNumberValidation.IsMacedonianMobileNumber)
            .WithMessage(PhoneNumberValidation.MacedonianMobileMessage);
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.University).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32)
            .Must(PhoneNumberValidation.IsMacedonianMobileNumber)
            .WithMessage(PhoneNumberValidation.MacedonianMobileMessage);
    }
}

public class RideCreateDtoValidator : AbstractValidator<RideCreateDto>
{
    public RideCreateDtoValidator()
    {
        RuleFor(x => x.StartLocation).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Destination).NotEmpty().MaximumLength(200);
        RuleFor(x => x.University).NotEmpty().MaximumLength(120);
        RuleFor(x => x.DepartureTime)
            .GreaterThan(DateTime.UtcNow.AddMinutes(-1))
            .WithMessage("Departure time must be in the future.");
        RuleFor(x => x.ExpectedArrivalTime)
            .GreaterThan(x => x.DepartureTime)
            .WithMessage("Expected arrival time must be after the departure time.");
        RuleFor(x => x.AvailableSeats).InclusiveBetween(1, 8);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).LessThanOrEqualTo(10_000);
        RuleFor(x => x.DistanceKm).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50_000);
        RuleFor(x => x.RecurrenceCount)
            .InclusiveBetween(1, 12)
            .When(x => x.IsRecurring)
            .WithMessage("Recurring rides can create between 1 and 12 rides.");
        RuleFor(x => x.RecurrenceIntervalDays)
            .InclusiveBetween(1, 30)
            .When(x => x.IsRecurring)
            .WithMessage("Recurring interval must be between 1 and 30 days.");
    }
}

public class ReportCreateDtoValidator : AbstractValidator<ReportCreateDto>
{
    public ReportCreateDtoValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Details).MaximumLength(1000);
        RuleFor(x => x)
            .Must(x => x.TargetUserId.HasValue || x.RideId.HasValue)
            .WithMessage("Report must target a user or a ride.");
    }
}

public class RideUpdateDtoValidator : AbstractValidator<RideUpdateDto>
{
    public RideUpdateDtoValidator()
    {
        RuleFor(x => x.StartLocation).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Destination).NotEmpty().MaximumLength(200);
        RuleFor(x => x.University).NotEmpty().MaximumLength(120);
        RuleFor(x => x.ExpectedArrivalTime)
            .GreaterThan(x => x.DepartureTime)
            .WithMessage("Expected arrival time must be after the departure time.");
        RuleFor(x => x.AvailableSeats).InclusiveBetween(0, 8);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).LessThanOrEqualTo(10_000);
        RuleFor(x => x.DistanceKm).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50_000);
    }
}

public class RideSearchDtoValidator : AbstractValidator<RideSearchDto>
{
    public RideSearchDtoValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.University).MaximumLength(120);
        RuleFor(x => x.Location).MaximumLength(200);
        RuleFor(x => x.MinSeats).InclusiveBetween(1, 8).When(x => x.MinSeats.HasValue);
    }
}

public class ChatSendDtoValidator : AbstractValidator<ChatSendDto>
{
    public ChatSendDtoValidator()
    {
        RuleFor(x => x.RideId).GreaterThan(0);
        RuleFor(x => x.ReceiverId).GreaterThan(0);
        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(2000);
    }
}

public class AdminUserUpdateDtoValidator : AbstractValidator<AdminUserUpdateDto>
{
    public AdminUserUpdateDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.University).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32)
            .Must(PhoneNumberValidation.IsMacedonianMobileNumber)
            .WithMessage(PhoneNumberValidation.MacedonianMobileMessage);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => Enum.TryParse<UserRole>(r, true, out _))
            .WithMessage("Role must be one of: Student, Driver, Admin.");
    }
}

public class ReviewCreateDtoValidator : AbstractValidator<ReviewCreateDto>
{
    public ReviewCreateDtoValidator()
    {
        RuleFor(x => x.TargetUserId).GreaterThan(0);
        RuleFor(x => x.RideId).GreaterThan(0);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).MaximumLength(1000);
    }
}
