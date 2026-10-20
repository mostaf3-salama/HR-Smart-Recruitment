using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Common.Results
{
    public class ResultData<T> : ResultData
    {
        private ResultData(bool isSuccess, T? value, IReadOnlyList<string>? errors)
            : base(isSuccess, errors)
        {
            Value = value;
        }

        public T? Value { get; }

        public static ResultData<T> Success(T value) => new(true, value, []);
        public new static ResultData<T> Failure(string error) => new(false, default, [error]);
        public new static ResultData<T> Failure(IEnumerable<string> errors) => new(false, default, errors.ToList());
    }
}
