
export class AppError {

  message: string;

  constructor(message: string) {
    this.message = message;
  }

  static is(error): error is AppError {
    return true;
  }

  getMessage() {
    return this.message;
  }
}

export class HttpAppError extends AppError {

  httpStatusCode: number;

  constructor(message: string, httpStatusCode: number) {
    super(message);
    this.httpStatusCode = httpStatusCode;
  }

  static is(error): error is HttpAppError {
    return true;
  }

  static is404(error): error is HttpAppError {
    return error.httpStatusCode === 404;
  }

  static is400(error): error is HttpAppError {
    return error.httpStatusCode === 400;
  }

  getMessage() {
    return super.getMessage();
  }

}
