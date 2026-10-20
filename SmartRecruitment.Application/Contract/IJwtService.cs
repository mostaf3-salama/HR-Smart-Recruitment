using SmartRecruitment.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Contract
{

    public interface IJwtService
    {
        string GenerateAccessToken(User user);

        string GenerateRefreshToken();
    }
}
