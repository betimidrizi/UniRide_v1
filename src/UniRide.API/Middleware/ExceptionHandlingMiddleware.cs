using System.Net.Mime;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using UniRide.Domain.Exceptions;

namespace UniRide.API.Middleware;

/// <summary>
/// Maps DomainException subclasses to RFC 7807 ProblemDetails responses.
/// Any other exception becomes 500 with a generic message (details land in logs).
/// </summary>
public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IHostEnvironment env)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DomainException ex)
        {
            logger.LogInformation(
                "Domain exception {ErrorCode} on {Method} {Path}: {Message}",
                ex.ErrorCode, context.Request.Method, context.Request.Path, ex.Message);

            await WriteProblemAsync(context, ex);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await WriteUnhandledAsync(context, ex);
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, DomainException ex)
    {
        if (context.Response.HasStarted) return;

        context.Response.Clear();
        context.Response.StatusCode = ex.StatusCode;
        context.Response.ContentType = "application/problem+json";

        ProblemDetails problem;

        if (ex is ValidationException ve && ve.Errors.Count > 0)
        {
            problem = new ValidationProblemDetails(
                ve.Errors.ToDictionary(k => k.Key, v => v.Value))
            {
                Status = ex.StatusCode,
                Title = "One or more validation errors occurred.",
                Type = $"https://uniride.dev/errors/{ex.ErrorCode}"
            };
        }
        else
        {
            problem = new ProblemDetails
            {
                Status = ex.StatusCode,
                Title = TitleFor(ex.StatusCode),
                Detail = ex.Message,
                Type = $"https://uniride.dev/errors/{ex.ErrorCode}"
            };
        }

        problem.Extensions["errorCode"] = ex.ErrorCode;
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await JsonSerializer.SerializeAsync(context.Response.Body, problem, JsonOptions);
    }

    private async Task WriteUnhandledAsync(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted) return;

        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = MediaTypeNames.Application.Json;

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Detail = env.IsDevelopment() ? ex.Message : "Please contact support if the problem persists.",
            Type = "https://uniride.dev/errors/internal"
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;

        await JsonSerializer.SerializeAsync(context.Response.Body, problem, JsonOptions);
    }

    private static string TitleFor(int status) => status switch
    {
        400 => "Bad request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not found",
        409 => "Conflict",
        _ => "Error"
    };
}
