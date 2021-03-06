import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AggregateCounter, BaseCounter, Counter, DashboardItem, FieldValueCounter, MetricType } from './model';
import { NotificationService } from '../shared/services/notification.service';
import { LoggerService } from '../shared/services/logger.service';
import { Page } from '../shared/model/page';
import { AppError } from '../shared/model/error.model';
import { interval, Observable, Subscription } from 'rxjs';
import { HttpUtils } from '../shared/support/http.utils';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ErrorHandler } from '../shared/model/error-handler';

@Injectable()
export class AnalyticsService {

  private metricsCountersUrl = '/metrics/counters';

  private metricsFieldValueCountersUrl = '/metrics/field-value-counters';

  private metricsAggregateCountersUrl = '/metrics/aggregate-counters';

  public counters: Page<Counter>;

  public _counterInterval = 2;

  public counterPoller: Subscription;

  public metricTypes: MetricType[] = MetricType.getMetricTypes();

  private rowId = 1;

  public dashboardItems: DashboardItem[];

  constructor(private httpClient: HttpClient,
              private errorHandler: ErrorHandler,
              private loggerService: LoggerService,
              private notificationService: NotificationService) {
  }

  public set counterInterval(rate: number) {
    if (rate !== undefined && !isNaN(rate)) {
      if (rate < 0.01) {
        rate = 0;
        this.stopPollingForCounters();
        this.notificationService.success(`Polling stopped.`);
      } else {
        this.loggerService.log('Setting interval to ' + rate);
        this._counterInterval = rate;
        if (this.counterPoller && !this.counterPoller.closed) {
          this.stopPollingForCounters();
          this.startPollingForCounters();
          this.notificationService.success(`Polling interval changed to ${rate}s.`);
        } else {
          this.startPollingForCounters();
          this.notificationService.success(`Polling started with interval of ${rate}s.`);
        }
      }
    }
  }

  public get counterInterval(): number {
    return this._counterInterval;
  }

  public totalCacheSize() {
    return Math.max(Math.ceil(60 / this.counterInterval), 20);
  }

  /**
   * Starts the polling process for ALL counters. Method
   * will check if the poller is already running and will
   * start the poller only if the poller is undefined or
   * stopped.
   */
  public startPollingForCounters() {
    if (!this.counterPoller || this.counterPoller.closed) {
      this.counterPoller = interval(this.counterInterval * 1000)
        .pipe(
          switchMap(() => this.getAllCounters(true))
        ).subscribe(
          result => {
          },
          error => {
            this.notificationService.error(AppError.is(error) ? error.getMessage() : error);
          });
    }
  }

  /**
   * Stops the polling process for counters if the poller
   * is running and is defined.
   */
  public stopPollingForCounters() {
    if (this.counterPoller && !this.counterPoller.closed) {
      this.counterPoller.unsubscribe();
    }
  }

  /**
   * Retrieves all counters. Will take pagination into account.
   *
   * @param detailed If true will request additional counter values from the REST endpoint
   */
  private getAllCounters(detailed = false): Observable<Page<Counter>> {

    if (!this.counters) {
      this.counters = new Page<Counter>();
      this.counters.pageSize = 50;
    }

    console.log('ici');
    console.log(detailed);

    const params = HttpUtils.getPaginationParams(this.counters.pageNumber, this.counters.pageSize);
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();

    if (detailed) {
      params.append('detailed', detailed.toString());
    }

    return this.httpClient
      .get<any>(this.metricsCountersUrl, { headers: httpHeaders, params: params })
      .pipe(
        map(response => this.extractData(response, detailed) as Page<Counter>),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Retrieves all field-value-counters.
   */
  private getAllFieldValueCounters(): Observable<Page<FieldValueCounter>> {
    const params = HttpUtils.getPaginationParams(0, 100);
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.httpClient.get<any>(this.metricsFieldValueCountersUrl, { params: params, headers: httpHeaders })
      .pipe(
        map(response => this.extractData(response, false) as Page<FieldValueCounter>),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Retrieves all aggregate counters.
   */
  private getAllAggregateCounters(): Observable<Page<AggregateCounter>> {
    const params = HttpUtils.getPaginationParams(0, 100);
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.httpClient.get<any>(this.metricsAggregateCountersUrl, { params: params, headers: httpHeaders })
      .pipe(
        map(response => this.extractData(response, false) as Page<AggregateCounter>),
        catchError(this.errorHandler.handleError)
      );
  }

  private extractData(body, handleRates: boolean): Page<BaseCounter> {
    const items: BaseCounter[] = [];
    const cache: BaseCounter[] = [];

    if (handleRates) {
      for (const oldCounter of this.counters.items) {
        cache[oldCounter.name] = oldCounter;
      }
      if (body._embedded && body._embedded.counterResourceList) {
        for (const counterResourceListItems of body._embedded.counterResourceList) {
          const counter = new Counter().deserialize(counterResourceListItems);

          if (cache[counter.name]) {
            const cached = cache[counter.name];
            counter.rates = cached.rates;
            counter.rates.push((counter.value - cached.value) / this.counterInterval);
            counter.rates.splice(0, counter.rates.length - this.totalCacheSize());
          }
          items.push(counter);
        }
      }
    } else {
      if (body._embedded && body._embedded.metricResourceList) {
        for (const metricResourceListItems of body._embedded.metricResourceList) {
          const counter = new Counter().deserialize(metricResourceListItems);
          items.push(counter);
        }
      } else if (body._embedded && body._embedded.aggregateCounterResourceList) {
        for (const aggregateCounterResourceListItems of body._embedded.aggregateCounterResourceList) {
          const counter = new AggregateCounter().deserialize(aggregateCounterResourceListItems);
          items.push(counter);
        }
      }
    }

    const page = new Page<BaseCounter>();
    page.items = items;
    page.totalElements = body.page.totalElements;
    page.pageNumber = body.page.number;
    page.pageSize = body.page.size;
    page.totalPages = body.page.totalPages;

    if (handleRates) {
      this.counters.update(page as Page<Counter>);
    }
    return page;
  }

  /**
   * Adds a new empty dashboard item to the dashboardItems array.
   */
  addNewDashboardItem(index?: number): DashboardItem {
    if (!this.dashboardItems) {
      this.dashboardItems = [];
    }

    const dashboardItem = new DashboardItem();
    dashboardItem.id = this.rowId++;

    if (index) {
      this.dashboardItems.splice(index, 0, dashboardItem);
    } else {
      this.dashboardItems.push(dashboardItem);
    }
    return dashboardItem;
  }

  /**
   * Remove dashboard item from dashboardItems array and splice the array.
   */
  removeDashboardItem(index: number): void {
    if (!this.dashboardItems || this.dashboardItems.length === 0) {
      return;
    }
    this.stopPollingOfSingleDashboardItem(this.dashboardItems[index]);
    this.dashboardItems.splice(index, 1);
  }

  /**
   * Initialize the array of {@link dashboardItem}s. Will add 1 new
   * {@link DashboardItem} as starting point.
   */
  initializeDashboardItems() {
    if (!this.dashboardItems) {
      this.addNewDashboardItem();
    } else {
      for (const dashboardItem of this.dashboardItems) {
        this.loggerService.log(`Start polling for dashboard item`, dashboardItem);
        this.startPollingForSingleDashboardItem(dashboardItem);
      }
    }
  }

  /**
   * Retrieve all metrics for a specific type.
   */
  getCountersForMetricType(metricType: MetricType): Observable<Page<BaseCounter>> {
    if (MetricType.COUNTER === metricType) {
      return this.getAllCounters();
    } else if (MetricType.AGGREGATE_COUNTER === metricType) {
      return this.getAllAggregateCounters();
    } else if (MetricType.FIELD_VALUE_COUNTER === metricType) {
      return this.getAllFieldValueCounters();
    } else {
      this.notificationService.error(`Metric type ${metricType.name} is not supported.`);
      return undefined;
    }
  }

  /**
   * All pollers of all {@link DashboarItem}s are stopped.
   */
  stopAllDashboardPollers() {
    if (this.dashboardItems) {
      for (const dashboardItemToDisable of this.dashboardItems) {
        this.stopPollingOfSingleDashboardItem(dashboardItemToDisable);
      }
    }
  }

  /**
   * Empties dashboard array and inserts a single dashboard item.
   * All pollers are stopped.
   */
  resetDashboard() {
    this.stopAllDashboardPollers();
    this.dashboardItems.length = 0;
    this.addNewDashboardItem();
  }

  /**
   * Starts the polling process for a single counters. Method
   * will check if the poller is already running and will
   * start the poller only if the poller is undefined or
   * stopped. The subscription is store on the {@link DashboardItem}.
   */
  public startPollingForSingleDashboardItem(dashboardItem: DashboardItem) {
    if ((!dashboardItem.counterPoller || dashboardItem.counterPoller.closed)
      && dashboardItem.counter) {

      let counterServiceCall: Observable<any>;
      let resultProcessor: Function;

      const localThis = this;

      if (dashboardItem.metricType === MetricType.COUNTER) {
        counterServiceCall = this.getSingleCounter(dashboardItem.counter.name);
        resultProcessor = function (result: Counter) {
          const counter = dashboardItem.counter as Counter;
          if (counter.value) {
            const rates = counter.rates;
            const res = (result.value - counter.value) / dashboardItem.refreshRate;

            rates.push(res);
            rates.splice(0, counter.rates.length - localThis.totalCacheSize());
            counter.rates = rates.slice();
          }
          counter.value = result.value;
        };
      } else if (dashboardItem.metricType === MetricType.FIELD_VALUE_COUNTER) {
        counterServiceCall = this.getSingleFieldValueCounter(dashboardItem.counter.name);
        resultProcessor = function (result: FieldValueCounter) {
          const counter = dashboardItem.counter as FieldValueCounter;
          counter.values = result.values.slice();
        };
      } else if (dashboardItem.metricType === MetricType.AGGREGATE_COUNTER) {
        counterServiceCall = this.getSingleAggregateCounter(dashboardItem.counter as AggregateCounter);
        resultProcessor = function (result: AggregateCounter) {
          const counter = dashboardItem.counter as AggregateCounter;
          counter.counts = result.counts.slice();
        };
      }

      dashboardItem.counterPoller = interval(dashboardItem.refreshRate * 1000)
        .pipe(
          switchMap(() => counterServiceCall)
        )
        .subscribe(
          result => resultProcessor(result),
          error => {
            this.loggerService.log('error', error);
            this.notificationService.error(AppError.is(error) ? error.getMessage() : error);
          });
    }
  }

  /**
   * Stops the polling process for counters if the poller
   * is running and is defined.
   */
  public stopPollingOfSingleDashboardItem(dashboardItem: DashboardItem) {
    if (dashboardItem.counterPoller && !dashboardItem.counterPoller.closed) {
      dashboardItem.counterPoller.unsubscribe();
    }
  }

  /**
   * Restarts the polling process for counters if the poller
   * is running and is defined. Will stop the poller first and restart
   * the counter with the {@link DashboardItem}s refresh rate.
   *
   * Will NOT restart the poller if the refresh rate is zero.
   */
  public restartPollingOfSingleDashboardItem(dashboardItem: DashboardItem) {
    this.stopPollingOfSingleDashboardItem(dashboardItem);
    if (dashboardItem.refreshRate > 0 && dashboardItem.counter) {
      this.startPollingForSingleDashboardItem(dashboardItem);
    }
  }

  /**
   * Retrieves a single counter.
   *
   * @param counterName Name of the counter for which to retrieve details
   */
  private getSingleCounter(counterName: string): Observable<Counter> {
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.httpClient.get<any>(this.metricsCountersUrl + '/' + counterName, { headers: httpHeaders })
      .pipe(
        map(body => {
          this.loggerService.log('body', body);
          return new Counter().deserialize(body);
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Retrieves a single Field-Value Counter.
   *
   * @param counterName Name of the counter for which to retrieve details
   */
  private getSingleFieldValueCounter(counterName: string): Observable<FieldValueCounter> {
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.httpClient.get<any>(this.metricsFieldValueCountersUrl + '/' + counterName, { headers: httpHeaders })
      .pipe(
        map(body => {
          return new FieldValueCounter().deserialize(body);
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Retrieves a single Aggregate Counter.
   *
   * @param counterName Name of the counter for which to retrieve details
   */
  private getSingleAggregateCounter(counter: AggregateCounter): Observable<AggregateCounter> {
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    const params = new HttpParams();
    params.append('resolution', counter.resolutionType.name.toLowerCase());
    return this.httpClient.get<any>(this.metricsAggregateCountersUrl + '/' + counter.name, { headers: httpHeaders, params: params })
      .pipe(
        map(body => {
          return new AggregateCounter().deserialize(body);
        }),
        catchError(this.errorHandler.handleError)
      );
  }
}
