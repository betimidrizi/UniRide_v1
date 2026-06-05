namespace UniRide.Application.DTOs;

public class RideCreateDto
{
    public string StartLocation { get; set; } = "";
    public string Destination { get; set; } = "";

    /// <summary>The day + time the driver leaves the start location.</summary>
    public DateTime DepartureTime { get; set; }

    /// <summary>The day + time the driver expects to arrive at the destination.</summary>
    public DateTime ExpectedArrivalTime { get; set; }

    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public string University { get; set; } = "";
    public double DistanceKm { get; set; }
    public bool IsRecurring { get; set; }
    public int RecurrenceCount { get; set; } = 1;
    public int RecurrenceIntervalDays { get; set; } = 7;
}

public class RideReadDto
{
    public int RideId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = "";
    public string StartLocation { get; set; } = "";
    public string Destination { get; set; } = "";
    public DateTime DepartureTime { get; set; }
    public DateTime ExpectedArrivalTime { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public string University { get; set; } = "";
    public double DistanceKm { get; set; }
    public string Status { get; set; } = "";
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrenceGroupId { get; set; }
    public int? RecurrenceIndex { get; set; }
}

public class RideUpdateDto
{
    public string StartLocation { get; set; } = "";
    public string Destination { get; set; } = "";
    public DateTime DepartureTime { get; set; }
    public DateTime ExpectedArrivalTime { get; set; }
    public int AvailableSeats { get; set; }
    public decimal Price { get; set; }
    public string University { get; set; } = "";
    public double DistanceKm { get; set; }
}

public class RideSearchDto
{
    public string? University { get; set; }
    public string? Location { get; set; }
    public DateTime? DepartureFrom { get; set; }
    public DateTime? DepartureTo { get; set; }
    public int? MinSeats { get; set; }
    public string? SortBy { get; set; }
    public bool IncludeArchived { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
