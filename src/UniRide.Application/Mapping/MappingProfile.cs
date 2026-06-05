using AutoMapper;
using UniRide.Application.DTOs;
using UniRide.Domain.Entities;

namespace UniRide.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Rides
        CreateMap<RideCreateDto, Ride>();

        CreateMap<Ride, RideReadDto>()
            .ForMember(dest => dest.DriverName,
                opt => opt.MapFrom(src => src.Driver != null ? src.Driver.FullName : string.Empty))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<Report, ReportReadDto>()
            .ForMember(dest => dest.ReporterName,
                opt => opt.MapFrom(src => src.Reporter != null ? src.Reporter.FullName : string.Empty))
            .ForMember(dest => dest.TargetUserName,
                opt => opt.MapFrom(src => src.TargetUser != null ? src.TargetUser.FullName : null))
            .ForMember(dest => dest.RideRoute,
                opt => opt.MapFrom(src => src.Ride != null ? $"{src.Ride.StartLocation} -> {src.Ride.Destination}" : null))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status.ToString()));

        // Reservations
        CreateMap<Reservation, ReservationReadDto>()
            .ForMember(dest => dest.PassengerName,
                opt => opt.MapFrom(src => src.Passenger != null ? src.Passenger.FullName : string.Empty))
            .ForMember(dest => dest.DriverName,
                opt => opt.MapFrom(src => src.Ride != null && src.Ride.Driver != null
                    ? src.Ride.Driver.FullName
                    : string.Empty))
            .ForMember(dest => dest.DriverId,
                opt => opt.MapFrom(src => src.Ride != null ? src.Ride.DriverId : 0))
            .ForMember(dest => dest.StartLocation,
                opt => opt.MapFrom(src => src.Ride != null ? src.Ride.StartLocation : string.Empty))
            .ForMember(dest => dest.Destination,
                opt => opt.MapFrom(src => src.Ride != null ? src.Ride.Destination : string.Empty))
            .ForMember(dest => dest.DepartureTime,
                opt => opt.MapFrom(src => src.Ride != null ? src.Ride.DepartureTime : default));

        // Chat
        CreateMap<ChatMessage, ChatMessageReadDto>();

        // Reviews
        CreateMap<Review, ReviewReadDto>();
        CreateMap<ReviewCreateDto, Review>();

        // Users
        CreateMap<User, UserProfileDto>()
            .ForMember(dest => dest.Role,
                opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<User, AdminUserDto>()
            .ForMember(dest => dest.Role,
                opt => opt.MapFrom(src => src.Role.ToString()));
    }
}
