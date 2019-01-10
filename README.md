# Spring Cloud Data Flow Analytics UI


## Introduction

This is the **Spring Cloud Data Flow Analytics** user interface (UI). The UI uses [Angular][].

<img alt="Spring Data Flow Dashboard" title="Spring Data Flow Dashboard" src="https://raw.githubusercontent.com/oodamien/spring-cloud-dataflow-analytics-ui/master/src/screenshots/screenshot-1.png" width="600">

---

## Configuration

Update the file `proxy.conf.json` to specify the Spring Data Flow server's URL.

```json
{
    "/metrics" : {
        "target": "http://localhost:9393/",
        "secure": false,
        "logLevel": "debug"
    }
}
```

---

## Run

For running the project, we use [npm][]. Please ensure that at a minimum [Node.js][], [npm][] and the [Angular CLI][] are available on your system. In order to execute the build simply do:

	$ git clone https://github.com/spring-cloud/spring-cloud-dataflow-analytics-ui.git
	$ cd spring-cloud-dataflow-analytics-ui
	$ npm install
	$ npm start

Before building be sure that the `ng-serve` development server has been shutdown.

Navigate to `http://localhost:4201/`. The app will automatically reload if you change any of the source files.

---

## Build


The following commands are also available:

```bash
# Run the project
$ npm start

# Build the project
$ npm build

# Run the unit tests
$ npm test

# Run lint
$ npm lint

# Run e2e tests
$ npm e2e
```

---

## Acknowledgments

This project uses code from several open source packages:
[Angular][],
[RxJS][],
[Font Awesome][]
(...).

This project is powered by:

<a href="http://pivotal.io/"><img alt="Pivotal" width="136" title="Pivotal" src="https://i.imgur.com/XPeBw7A.png"></a> <a href="http://spring.io/"><img alt="Spring" title="Spring" src="https://i.imgur.com/az8Xady.png" width="155"></a>

[Angular]: http://angular.io/
[Angular CLI]: https://cli.angular.io/
[RxJS]: https://github.com/ReactiveX/rxjs
[frontend-maven-plugin]: https://github.com/eirslett/frontend-maven-plugin
[Git]: https://git-scm.com/
[Maven]: http://maven.apache.org/
[Node.js]: http://nodejs.org/
[npm]: https://www.npmjs.com/
[Protractor]: https://github.com/angular/protractor
[Font Awesome]: https://fontawesome.com/v4.7.0/icons/
