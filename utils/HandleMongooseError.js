/**
 * 從 Mongoose 的 ValidationError 取第一個驗證錯誤訊息
 * @param error Mongoose validation error
 * @returns error message
 */

export const getMessageFromValidationError = (error) => {
  const key = Object.keys(error.errors)[0]
  return error.errors[key].message
}
