import { isInteger, toSafeInteger } from 'lodash'
import { ParametersException } from '@ysslin/alioth'

export function getSafeParamId (paramsId: number) {
  const id = toSafeInteger(paramsId)
  if (!isInteger(id)) {
    throw new ParametersException({
      code: 10030
    })
  }
  return id
}