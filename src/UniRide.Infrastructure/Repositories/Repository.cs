using Microsoft.EntityFrameworkCore;
using UniRide.Application.Interfaces;
using UniRide.Infrastructure.Data;

namespace UniRide.Infrastructure.Repositories;

public class Repository<T>(AppDbContext db) : IRepository<T> where T : class
{
    public Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default) =>
        db.Set<T>().ToListAsync(cancellationToken);

    public Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Set<T>().FindAsync(new object[] { id }, cancellationToken).AsTask();

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await db.Set<T>().AddAsync(entity, cancellationToken);

    public void Update(T entity) => db.Set<T>().Update(entity);

    public void Delete(T entity) => db.Set<T>().Remove(entity);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public IQueryable<T> Query() => db.Set<T>().AsQueryable();

    public IQueryable<T> QueryNoTracking() => db.Set<T>().AsNoTracking();
}
