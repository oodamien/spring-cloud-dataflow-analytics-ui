import { NgModule } from '@angular/core';
import { AnalyticsComponent } from './analytics.component';
import { CountersComponent } from './counters/counters.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRoutingModule } from './analytics-routing.module';
import { BarChartComponent } from './charts/bar-chart/bar-chart.component';
import { BubbleChartComponent } from './charts/bubble-chart/bubble-chart.component';
import { GraphChartComponent } from './charts/graph-chart/graph-chart.component';
import { CounterHeaderComponent } from './components/counter-header.component';
import { PieChartComponent } from './charts/pie-chart/pie-chart.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    AnalyticsRoutingModule,
    SharedModule
  ],
  declarations: [
    AnalyticsComponent,
    BarChartComponent,
    BubbleChartComponent,
    CountersComponent,
    CounterHeaderComponent,
    DashboardComponent,
    GraphChartComponent,
    PieChartComponent
  ],
  providers: [
    AnalyticsService
  ]
})
export class AnalyticsModule {
}
