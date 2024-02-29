export class ApiException extends Error {
  constructor(error: string) {
    super(error);
  }
}
