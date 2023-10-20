import { DoAllSuggestion, ReductionSuggestion } from './DiscoPoPParser'

export default class SnippetBuilder {
    public static buildSnippet(
        recommendation: DoAllSuggestion | ReductionSuggestion
    ): string {
        let result = recommendation.pragma

        result = SnippetBuilder.appendPrivate(result, recommendation.priv)

        result = SnippetBuilder.appendFirstPrivate(
            result,
            recommendation.firstPrivate
        )

        result = SnippetBuilder.appendLastPrivate(
            result,
            recommendation.lastPrivate
        )

        result = SnippetBuilder.appendShared(result, recommendation.shared)

        result = SnippetBuilder.appendReduction(
            result,
            recommendation.reduction
        )

        if (!result) {
            return ''
        }

        result += '\n'

        return result
    }

    static appendPrivate(str, priv) {
        if (!priv || !priv.length) {
            return str
        }

        return `${str} private${this.appendParanthesis(priv.toString())}`
    }

    static appendFirstPrivate(str, priv) {
        if (!priv || !priv.length) {
            return str
        }

        return `${str} firstprivate${this.appendParanthesis(priv.toString())}`
    }

    static appendLastPrivate(str, priv) {
        if (!priv || !priv.length) {
            return str
        }

        return `${str} lastprivate${this.appendParanthesis(priv.toString())}`
    }

    static appendShared(str, priv) {
        if (!priv || !priv.length) {
            return str
        }

        return `${str} shared${this.appendParanthesis(priv.toString())}`
    }

    static appendReduction(str, priv) {
        if (!priv || !priv.length) {
            return str
        }

        return `${str} reduction${this.appendParanthesis(priv.toString())}`
    }

    static appendParanthesis(str) {
        return `(${str})`
    }
}
