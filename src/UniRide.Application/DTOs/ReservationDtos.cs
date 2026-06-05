using UniRide.Domain.Enums;

namespace UniRide.Application.DTOs;

public class ReservationReadDto
{
    public int ReservationId { get; set; }
    public int RideId { get; set; }
    public int PassengerId { get; set; }
    public string PassengerName { get; set; } = "";
    public string DriverName { get; set; } = "";
    public int DriverId { get; set; }
    public string StartLocation { get; set; } = "";
    public string Destination { get; set; } = "";
    public DateTime DepartureTime { get; set; }
    public ReservationStatus ReservationStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}
