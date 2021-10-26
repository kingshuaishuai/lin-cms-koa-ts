import { HttpException, CodeMessageContainer, Exception } from '@ysslin/alioth'

export class BookNotFound extends HttpException {
  constructor (ex?: Exception | number) {
    super()
    this.status = 404
    this.code = 10022
    this.message = CodeMessageContainer.codeMessage.getMessage(10022)
    this.exceptionHandler(ex)
  }
}
