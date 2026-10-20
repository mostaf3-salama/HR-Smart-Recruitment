using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartRecruitment.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Feature3_CandidateLinkAndCvPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CvFilePath",
                table: "Candidates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CandidateUserLinks",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CandidateId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateUserLinks", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_CandidateUserLinks_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidateUserLinks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CandidateUserLinks_CandidateId",
                table: "CandidateUserLinks",
                column: "CandidateId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CandidateUserLinks");

            migrationBuilder.DropColumn(
                name: "CvFilePath",
                table: "Candidates");
        }
    }
}
