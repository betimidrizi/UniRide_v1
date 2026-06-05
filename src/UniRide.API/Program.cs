using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using UniRide.API.Hubs;
using Serilog;
using UniRide.API.Middleware;
using UniRide.API.Seeding;
using UniRide.Application.Interfaces;
using UniRide.Application.Mapping;
using UniRide.Application.Services;
using UniRide.Application.Settings;
using UniRide.Application.Validators;
using UniRide.Infrastructure.Data;
using UniRide.Infrastructure.Repositories;
using UniRide.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ──────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/uniride-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// ── Strongly-typed settings ──────────────────────────────────────────────
builder.Services
    .Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName))
    .Configure<AdminSeedSettings>(builder.Configuration.GetSection(AdminSeedSettings.SectionName))
    .Configure<CorsSettings>(builder.Configuration.GetSection(CorsSettings.SectionName))
    .Configure<AuthLockoutSettings>(builder.Configuration.GetSection(AuthLockoutSettings.SectionName))
    .Configure<RidesSettings>(builder.Configuration.GetSection(RidesSettings.SectionName));

var jwt = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must be configured with at least 32 characters. " +
        "For development, set it in appsettings.Development.json. " +
        "For production, use user-secrets, environment variables, or a secret vault.");
}

var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>()
    ?? new CorsSettings();

// ── MVC + JSON + ProblemDetails ──────────────────────────────────────────
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(o =>
    {
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var problem = new ValidationProblemDetails(ctx.ModelState)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "One or more validation errors occurred.",
                Type = "https://uniride.dev/errors/validation_failed",
                Instance = ctx.HttpContext.Request.Path
            };
            problem.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
            return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
        };
    });

builder.Services.AddProblemDetails();
builder.Services.AddSignalR();

// ── FluentValidation ─────────────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();

// ── Swagger ──────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "UniRide API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── EF Core ──────────────────────────────────────────────────────────────
// Picks Sqlite when ConnectionStrings:Provider == "Sqlite" (dev default),
// SqlServer otherwise (production / LocalDB).
var dbProvider = builder.Configuration["ConnectionStrings:Provider"] ?? "SqlServer";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        opt.UseSqlite(connectionString);
    else
        opt.UseSqlServer(connectionString);
});

// ── AutoMapper ───────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ── Services & repositories ──────────────────────────────────────────────
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRideService, RideService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IReportService, ReportService>();

// ── CORS (config-driven) ─────────────────────────────────────────────────
builder.Services.AddCors(o =>
    o.AddPolicy("frontend", p =>
    {
        p.AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        if (corsSettings.AllowedOrigins.Length > 0)
            p.WithOrigins(corsSettings.AllowedOrigins);
        else
            p.WithOrigins("http://localhost:5173");
    }));

// ── JWT Bearer ───────────────────────────────────────────────────────────
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        o.SaveToken = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
        // Validate that the user behind the token still exists & is not suspended.
        // Catches "stale session after DB reset" cleanly with a 401 instead of
        // letting it die deep in EF with a FOREIGN KEY failure.
        o.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/hubs/chat"))
                    ctx.Token = accessToken;
                return Task.CompletedTask;
            },
            OnTokenValidated = async ctx =>
            {
                var idClaim = ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(idClaim, out var userId))
                {
                    ctx.Fail("Invalid user identifier claim.");
                    return;
                }

                var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var user = await db.Users
                    .AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => new { u.UserId, u.IsSuspended })
                    .FirstOrDefaultAsync();

                if (user is null)
                {
                    ctx.Fail("Session is no longer valid. Please sign in again.");
                    return;
                }
                if (user.IsSuspended)
                {
                    ctx.Fail("Account is suspended.");
                    return;
                }
            }
        };
    });

builder.Services.AddAuthorization();

// ── Rate limiting ────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict policy for auth endpoints — 5 attempts / minute / IP.
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "global",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Generic per-IP cap to prevent abuse.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "global",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddHealthChecks();

// ── Build ────────────────────────────────────────────────────────────────
var app = builder.Build();

// Seed DB
await DatabaseSeeder.ApplyAsync(app.Services, app.Logger);

// ── Pipeline ─────────────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UniRide API v1");
        c.DocumentTitle = "UniRide API — Swagger";
    });
}
else
{
    app.UseHsts();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");

app.Run();

public partial class Program { }
