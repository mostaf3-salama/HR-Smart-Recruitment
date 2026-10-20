using Microsoft.EntityFrameworkCore;
using SmartRecruitment.Domain.Interfaces;
using SmartRecruitment.Infrastructure.Presistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Infrastructure.Repository
{
    public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
    {
        private readonly SmartRecruitmentDbContext _context;

        public GenericRepository(SmartRecruitmentDbContext context)
        {
            _context = context;
        }
        public async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
        {

            await _context.Set<TEntity>().AddAsync(entity, cancellationToken);
            return entity;
        }

        public void Delete(TEntity entity)
        {
         _context.Set<TEntity>().Remove(entity);
        }

        public async Task<IReadOnlyList<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
        {
            return await _context.Set<TEntity>().Where(predicate).ToListAsync(cancellationToken);
        }

        public Task<TEntity?> FirstOrDefaultAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
        {
            return _context.Set<TEntity>().FirstOrDefaultAsync(predicate, cancellationToken);
        }

        public async Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
 return await _context.Set<TEntity>().ToListAsync(cancellationToken);   

        }

        public async Task<TEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
           return await _context.Set<TEntity>().FindAsync(new object[] { id }, cancellationToken);
        }

        public void Update(TEntity entity)
        {
_context.Set<TEntity>().Update(entity); 
        }
    }
}
