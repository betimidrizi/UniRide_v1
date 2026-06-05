namespace UniRide.Domain.Exceptions;

/// <summary>
/// Base for every exception raised by the domain or application layer
/// that is intentionally surfaced to the API consumer. The global
/// exception-handling middleware maps each subclass to an RFC 7807
/// ProblemDetails response with the appropriate HTTP status.
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
    protected DomainException(string message, Exception inner) : base(message, inner) { }

    public abstract int StatusCode { get; }
    public abstract string ErrorCode { get; }
}

/// <summary>Maps to 400 Bad Request — caller supplied invalid input.</summary>
public sealed class ValidationException : DomainException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public override int StatusCode => 400;
    public override string ErrorCode => "validation_failed";
}

/// <summary>Maps to 404 Not Found.</summary>
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string resource, object key)
        : base($"{resource} '{key}' was not found.") { }

    public NotFoundException(string message) : base(message) { }

    public override int StatusCode => 404;
    public override string ErrorCode => "not_found";
}

/// <summary>Maps to 409 Conflict — business invariant or uniqueness violation.</summary>
public sealed class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }

    public override int StatusCode => 409;
    public override string ErrorCode => "conflict";
}

/// <summary>Maps to 403 Forbidden — caller is authenticated but not allowed.</summary>
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You are not allowed to perform this action.")
        : base(message) { }

    public override int StatusCode => 403;
    public override string ErrorCode => "forbidden";
}

/// <summary>Maps to 401 Unauthorized — credentials missing or invalid.</summary>
public sealed class UnauthorizedDomainException : DomainException
{
    public UnauthorizedDomainException(string message = "Authentication is required.")
        : base(message) { }

    public override int StatusCode => 401;
    public override string ErrorCode => "unauthorized";
}
