namespace UniRide.Application.DTOs;

public record ReviewCreateDto(int TargetUserId, int RideId, int Rating, string? Comment);

public record ReviewReadDto(
    int ReviewId,
    int ReviewerId,
    int TargetUserId,
    int RideId,
    int Rating,
    string? Comment,
    DateTime CreatedAt);
