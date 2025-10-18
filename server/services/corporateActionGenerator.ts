import { randomInt } from 'crypto'
import { CorporateAction, DividendDetails, RightIssueDetails, BonusIssueDetails } from '../types/'
import { RIGHT_ISSUE_DISCOUNT, DIVIDEND_PERCENTAGE } from '../constants'

/**
 * Service for generating corporate actions
 * Manages corporate action generation logic
 */
export class CorporateActionGenerator {
  generateCorporateAction(currentRound: number, currentTurn: number): CorporateAction {
    const actionTypes: ('dividend' | 'right_issue' | 'bonus_issue')[] = [
      'dividend',
      'right_issue',
      'bonus_issue',
    ]
    const type = actionTypes[randomInt(actionTypes.length)]

    const id = `${type}-${currentRound}-${currentTurn}-${Date.now()}`

    switch (type) {
      case 'dividend': {
        const dividendPercent = (DIVIDEND_PERCENTAGE * 100).toFixed(0)
        return {
          id,
          type: 'dividend',
          // No symbol assigned - player will choose when playing
          title: `Declare Dividend`,
          description: `Announce dividend payout to shareholders of selected stock (${dividendPercent}% of stock price)`,
          details: {
            dividendPercentage: DIVIDEND_PERCENTAGE,
          } as DividendDetails,
          round: currentRound,
          playersProcessed: [],
        }
      }

      case 'right_issue': {
        // Fixed ratio: 1 for every 2 shares with configurable discount
        const discountPercent = ((1 - RIGHT_ISSUE_DISCOUNT) * 100).toFixed(0)
        return {
          id,
          type: 'right_issue',
          // No symbol assigned - player will choose when playing
          title: `Announce Right Issue`,
          description: `Offer new shares to existing shareholders at ${discountPercent}% discount (1:2 ratio)`,
          details: {
            ratio: 1,
            baseShares: 2,
            discountPercentage: RIGHT_ISSUE_DISCOUNT,
          } as RightIssueDetails,
          round: currentRound,
          playersProcessed: [],
        }
      }

      case 'bonus_issue':
        // Fixed ratio: 1 for every 5 shares
        return {
          id,
          type: 'bonus_issue',
          // No symbol assigned - player will choose when playing
          title: `Announce Bonus Issue`,
          description: `Issue bonus shares to existing shareholders (1:5 ratio)`,
          details: {
            ratio: 1,
            baseShares: 5,
          } as BonusIssueDetails,
          round: currentRound,
          playersProcessed: [],
        }
    }
  }
}
