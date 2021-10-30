import { getLogger } from '../../../shared/logger'
import MessageListStore, {
  MessageListStoreState,
} from '../../stores/MessageListStore'

const log = getLogger('renderer/message/MessageList-Helpers')

export function withoutTopPages(
  messageListRef: React.RefObject<any>,
  messageListWrapperRef: React.RefObject<any>
) {
  const pageOrdering = MessageListStore.state.pageOrdering

  const withoutPages = []
  let withoutPagesHeight = messageListRef.current.scrollHeight
  const messageListWrapperHeight = messageListWrapperRef.current.clientHeight

  for (let i = 0; i < pageOrdering.length - 1; i++) {
    const pageKey = pageOrdering[i]
    const pageDOMElement = document.querySelector('#' + pageKey)
    if (!pageDOMElement) return
    const pageHeight = pageDOMElement.clientHeight
    const updatedWithoutPagesHeight = withoutPagesHeight - pageHeight

    if (updatedWithoutPagesHeight > messageListWrapperHeight * 4) {
      withoutPages.push(pageKey)
      withoutPagesHeight = updatedWithoutPagesHeight
    } else {
      break
    }
  }
  return withoutPages
}
export function withoutBottomPages(
  messageListRef: React.RefObject<any>,
  messageListWrapperRef: React.RefObject<any>
) {
  const messageListWrapperHeight = messageListWrapperRef.current.clientHeight
  let withoutPagesHeight = messageListRef.current.scrollHeight

  log.debug(
    `withoutBottomPages messageListWrapperHeight: ${messageListWrapperHeight} withoutPagesHeight: ${withoutPagesHeight}`
  )

  const pageOrdering = MessageListStore.state.pageOrdering
  const withoutPages = []
  for (let i = pageOrdering.length - 1; i > 0; i--) {
    const pageKey = pageOrdering[i]
    log.debug(`withoutBottomPages: pageKey: ${pageKey} i: ${i}`)
    const pageElement = document.querySelector('#' + pageKey)
    if (!pageElement) {
      log.debug(
        `withoutBottomPages: could not find dom element of pageKey: ${pageKey}. Skipping.`
      )
      continue
    }
    const pageHeight = pageElement.clientHeight
    const updatedWithoutPagesHeight = withoutPagesHeight - pageHeight
    log.debug(
      `withoutBottomPages messageListWrapperHeight: ${messageListWrapperHeight} updatedWithoutPagesHeight: ${updatedWithoutPagesHeight}`
    )
    if (updatedWithoutPagesHeight > messageListWrapperHeight * 4) {
      withoutPages.push(pageKey)
      withoutPagesHeight = updatedWithoutPagesHeight
    } else {
      log.debug(`withoutBottomPages: Found all removable pages. Breaking.`)
      break
    }
  }

  return withoutPages
}

export function* messagesInView(
  messageListRef: React.RefObject<HTMLElement>
) {
  const messageListDOMElement = document
    .querySelector('#message-list')
  if (!messageListDOMElement) return
  const messageElements = messageListDOMElement
    .querySelectorAll('li')

  if (!messageListRef.current) return
  const scrollTop = messageListRef.current.scrollTop
  const messageListClientHeight = messageListRef.current.clientHeight
  const messageListOffsetTop = scrollTop
  const messageListOffsetBottom = messageListOffsetTop + messageListClientHeight

  for (const messageElement of messageElements) {
    const messageOffsetTop = messageElement.offsetTop
    const messageOffsetBottom = messageOffsetTop + messageElement.clientHeight

    if (
      mathInBetween(
        messageListOffsetTop,
        messageListOffsetBottom,
        messageOffsetTop
      ) ||
      mathInBetween(
        messageListOffsetTop,
        messageListOffsetBottom,
        messageOffsetBottom
      ) ||
      (messageOffsetTop < messageListOffsetTop &&
        messageOffsetBottom > messageListOffsetBottom)
    ) {
      yield {
        messageListClientHeight,
        messageListOffsetTop,
        messageListOffsetBottom,
        messageElement,
        messageOffsetTop,
        messageOffsetBottom,
      }
    }
  }
}

export function isOnePageOrMoreAwayFromNewestMessage(
  messageListStore: MessageListStoreState,
  messageListRef: React.RefObject<HTMLDivElement>
) {
  const debug = (str: String) =>
    log.debug('isOnePageOrMoreAwayFromNewestMessage: ' + str)

  const newestMessageIndex = messageListStore.messageIds.length - 1
  debug(`newestMessageIndex: ${newestMessageIndex}`)
  const lastLoadedPageKey =
    messageListStore.pageOrdering[messageListStore.pageOrdering.length - 1]
  debug(`lastLoadedPageKey: ${lastLoadedPageKey}`)
  const lastLoadedPage = messageListStore.pages[lastLoadedPageKey]
  debug(`lastLoadedPage: ${lastLoadedPage}`)

  const newestMessageIndexOnLastLoadedPage = lastLoadedPage.lastMessageIdIndex

  // First check that we even have loaded the newest message index. Otherwise
  // we are for sure more far away!
  if (newestMessageIndexOnLastLoadedPage !== newestMessageIndex) {
    return true
  }
  if (!messageListRef.current) return false

  const scrollBottom =
    messageListRef.current.scrollTop + messageListRef.current.clientHeight
  const scrollHeight = messageListRef.current.scrollHeight
  const halfClientHeight = messageListRef.current.clientHeight / 2
  const border = scrollHeight - halfClientHeight

  if (scrollBottom >= border) {
    return false
  }

  return true
}

export function mathInBetween(
  windowLow: number,
  windowHigh: number,
  value: number
) {
  return value >= windowLow && value <= windowHigh
}

export function isScrolledToBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
) {
  return scrollTop >= scrollHeight - clientHeight
}

export function* rotateAwayFromIndex(index: number, length: number) {
  let count = 0

  let distance = 1
  while (count < length - 1) {
    const positive_rotate_index = index + distance
    if (positive_rotate_index < length) {
      yield positive_rotate_index
      count++
    }
    const negative_rotate_index = index - distance
    if (negative_rotate_index >= 0) {
      yield negative_rotate_index
      count++
    }
    distance++
  }
}
