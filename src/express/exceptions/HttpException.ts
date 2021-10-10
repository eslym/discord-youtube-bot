
export class HttpException extends Error{
    public status: number;

    constructor(message?: string, status: number = 500) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, HttpException.prototype);
    }
}