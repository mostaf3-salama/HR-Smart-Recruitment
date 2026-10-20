import { Routes } from '@angular/router';
import { INTERVIEWS_API } from './data/interviews-api';
import { HttpInterviewsApi } from './data/http-interviews.api';
import { MockInterviewsApi } from './data/mock-interviews.api';
import { InterviewListComponent } from './pages/interview-list/interview-list.component';

/**
 * Routes of mahmoud's interviews part of Feature 4.
 * Expected URL (as agreed in the task sheet):
 *   /hr/interviews   (supports `?applicationId=` deep-link from the applicant details page)
 */
export const INTERVIEW_ROUTES: Routes = [
  {
    path: '',
    // providers: [{ provide: INTERVIEWS_API, useClass: MockInterviewsApi }],
    providers: [{ provide: INTERVIEWS_API, useClass: HttpInterviewsApi }],
    children: [{ path: 'interviews', component: InterviewListComponent, title: 'Interviews' }],
  },
];
