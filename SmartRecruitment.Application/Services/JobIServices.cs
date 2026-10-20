using FluentValidation;
using FluentValidation.TestHelper;
using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Jobs;
using SmartRecruitment.Application.Interfaces;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Services
{
    public class JobIServices : IJobService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IValidator<CreateJobDto> _createJobValidator;
        private readonly IValidator<UpdateJobDto> _updateJobValidator;

        public JobIServices(IUnitOfWork unitOfWork, IValidator<CreateJobDto> createJobValidator,
        IValidator<UpdateJobDto> updateJobValidator)
        { 
            _unitOfWork = unitOfWork;
            _createJobValidator = createJobValidator;
            _updateJobValidator = updateJobValidator;
        }

        public async Task<ResultData<JobResponseDto>> CreateJobAsync(CreateJobDto dto, CancellationToken cancellationToken = default)
        {
            //validation
            var validationResult = await _createJobValidator.ValidateAsync(dto, cancellationToken);
         
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    return ResultData<JobResponseDto>.Failure(errors);
                }
            var hrList = await _unitOfWork.Repository<Hr>()
           .FindAsync(h => h.Id == dto.Hrid, cancellationToken);

            if (!hrList.Any())
            {
                return ResultData<JobResponseDto>.Failure($"HR with ID {dto.Hrid} does not exist.");
            }
            var existingJobs = await _unitOfWork.Repository<Job>()
              .FindAsync(j => j.Title.ToLower() == dto.Title.ToLower(), cancellationToken);

            if (existingJobs.Any())
            {
                return ResultData<JobResponseDto>.Failure($"A job with the title '{dto.Title}' already exists.");
            }
            // Inside JobServices.cs -> CreateJobAsync
         
            //create a new job entity
            var job = new Job
            {
                Hrid = dto.Hrid,
                Title = dto.Title,
                Description = dto.Description,
                RequiredSkills = dto.RequiredSkills,
                ExperienceRequired = dto.ExperienceRequired,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };


            await _unitOfWork.Repository<Job>().AddAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            var jobResponseDto = new JobResponseDto
            {
                Id = job.Id,
                Hrid = job.Hrid,
                Title = job.Title,
                Description = job.Description,
                RequiredSkills = job.RequiredSkills,
                ExperienceRequired = job.ExperienceRequired,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt
            };
            return ResultData<JobResponseDto>.Success(jobResponseDto);
        }

        public async Task<ResultData> DeleteJobAsync(int id, CancellationToken cancellationToken = default)
        {
            //check if the job 
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(id, cancellationToken);
            if (job==null)
            {
                return ResultData.Failure($"Job with ID '{id}' was not found.");
            }
            if (id < 0)
            {
                return ResultData.Failure("Invalid job ID. ID must be a positive integer.");

            }
             _unitOfWork.Repository<Job>().Delete(job );
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ResultData.Success();
        }

        public async Task<ResultData<IEnumerable<JobResponseDto>>> GetAllJobsAsync(bool activeOnly = false, CancellationToken cancellationToken = default)
        {
            var jobs = await _unitOfWork.Repository<Job>().GetAllAsync(cancellationToken);

            if (jobs == null || !jobs.Any())
            {
                return ResultData<IEnumerable<JobResponseDto>>.Success(Enumerable.Empty<JobResponseDto>());
            }

            var responseDtos = jobs
                .Where(j => !activeOnly || j.IsActive)
                .Select(j => new JobResponseDto
            {
                Id = j.Id,
                Hrid = j.Hrid,
                Title = j.Title,
                Description = j.Description,
                RequiredSkills = j.RequiredSkills,
                ExperienceRequired = j.ExperienceRequired,
                IsActive = j.IsActive,
                CreatedAt = j.CreatedAt
            });
            return ResultData<IEnumerable<JobResponseDto>>.Success(responseDtos);
        }
        public async Task<ResultData<JobResponseDto>> GetJobByIdAsync(int id, CancellationToken cancellationToken = default)
        {

            // check if the job exists
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(id, cancellationToken);
            if (job == null)
            {
                return ResultData<JobResponseDto>.Failure($"Job with ID '{id}' was not found.");
            }
            if (id <= 0)
            {
                return ResultData<JobResponseDto>.Failure("Invalid Job ID.");
            }

            var jobResponseDto = new JobResponseDto
            {
                Id = job.Id,
                Hrid = job.Hrid,
                Title = job.Title,
                Description = job.Description,
                RequiredSkills = job.RequiredSkills,
                ExperienceRequired = job.ExperienceRequired,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt
            };
            return ResultData<JobResponseDto>.Success(jobResponseDto);
        }

        public async Task<ResultData> ToggleJobStatusAsync(int id, CancellationToken cancellationToken = default)
        {
            if (id <= 0)
            {
                return  ResultData.Failure("Invalid Job ID.");
            }

            var job = await  _unitOfWork.Repository<Job>().GetByIdAsync(id, cancellationToken);
            if (job == null)
            {
                return ResultData.Failure($"Job with ID '{id}' was not found.");
            }

            job.IsActive = !job.IsActive;
            _unitOfWork.Repository<Job>().Update(job);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ResultData.Success();
        }

        public async Task<ResultData> UpdateJobAsync(int id, UpdateJobDto dto, CancellationToken cancellationToken = default)
        {
            if (id <= 0)
            {
                return ResultData.Failure("Invalid Job ID.");
            }

            // 1. Validation
            var validationResult =await  _updateJobValidator.ValidateAsync(dto, cancellationToken);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return ResultData.Failure(errors);
            }

            // 2. Check Existence
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(id, cancellationToken);
            if (job == null)
            {
                return ResultData.Failure($"Job with ID '{id}' was not found.");
            }

            // 3. Update & Save
            job.Title = dto.Title;
            job.Description = dto.Description;
            job.RequiredSkills = dto.RequiredSkills;
            job.ExperienceRequired = dto.ExperienceRequired;

            _unitOfWork.Repository<Job>().Update(job);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ResultData.Success();
        }
    }
}
