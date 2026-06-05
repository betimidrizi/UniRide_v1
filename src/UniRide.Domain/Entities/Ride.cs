using UniRide.Domain.Enums;

namespace UniRide.Domain.Entities;

public class Ride : BaseEntity
{
    public int RideId { get; set; }
    public int DriverId { get; set; }
    public User? Driver { get; set; }

    public string StartLocation { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ExpectedArrivalTime { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public string University { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public RideStatus Status { get; set; } = RideStatus.Open;

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrenceGroupId { get; set; }
    public int? RecurrenceIndex { get; set; }

    /// <summary>EF Core optimistic concurrency token — prevents the
    /// "last passenger grabs the same seat twice" race in JoinRideAsync.</summary>
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
