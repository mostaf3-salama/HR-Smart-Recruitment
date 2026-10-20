namespace SmartRecruitment.Application.Common.Results;

public class ResultData
{
    protected ResultData(bool isSuccess, IReadOnlyList<string>? errors)
    {
        IsSuccess = isSuccess; //
        Errors = errors ?? [];
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public IReadOnlyList<string> Errors { get; }

    public static ResultData Success() => new(true, []);
    public static ResultData Failure(string error) => new(false, [error]);
    public static ResultData Failure(IEnumerable<string> errors) => new(false, errors.ToList());
}

