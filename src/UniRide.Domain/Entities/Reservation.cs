using UniRide.Domain.Enums;

namespace UniRide.Domain.Entities;

public class Reservation : BaseEntity
{
    public int ReservationId { get; set; }

    public int RideId { get; set; }
    public Ride? Ride { get; set; }

    public int PassengerId { get; set; }
    public User? Passenger { get; set; }

    public ReservationStatus ReservationStatus { get; set; } = ReservationStatus.Pending;
}
