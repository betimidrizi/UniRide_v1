using FluentValidation;
using UniRide.Application.DTOs;

namespace UniRide.Application.Validators;

/// <summary>
/// Enhanced validator for <see cref="ReviewCreateDto"/>. FluentValidation
/// auto-registers all <see cref="AbstractValidator{T}"/> from this assembly.
/// </summary>
public class ReviewCreateDtoEnhancedValidator : AbstractValidator<ReviewCreateDto>
{
    public ReviewCreateDtoEnhancedValidator()
    {
        RuleFor(x => x.TargetUserId).GreaterThan(0);
        RuleFor(x => x.RideId).GreaterThan(0);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).MaximumLength(1000);
    }
}
