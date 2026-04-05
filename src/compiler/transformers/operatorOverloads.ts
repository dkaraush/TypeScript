import { isBinaryExpression, isElementAccessExpression, isPrefixUnaryExpression, isSourceFile } from "../factory/nodeTests";
import { Bundle, Expression, Node, SourceFile, SyntaxKind, TransformationContext } from "../types";
import { visitEachChild, visitNode } from "../visitorPublic";

export function transformOperatorOverloads(context: TransformationContext) {
  const f = context.factory;
  const resolver = context.getEmitResolver();

  const visit = (node: Node): Node => {
    if (isBinaryExpression(node)) {
        const info = resolver.getResolvedOperatorInfo?.(node);
            if (info && !info.isUnary) {
            const left  = visitNode(node.left,  visit) as Expression;
            const right = visitNode(node.right, visit) as Expression;
            switch (node.operatorToken.kind) {
                case SyntaxKind.PlusToken:
                case SyntaxKind.MinusToken:
                case SyntaxKind.AsteriskToken:
                case SyntaxKind.SlashToken:
                case SyntaxKind.EqualsEqualsToken:
                case SyntaxKind.ExclamationEqualsToken:
                case SyntaxKind.EqualsEqualsEqualsToken:
                case SyntaxKind.ExclamationEqualsEqualsToken:
                case SyntaxKind.CaretToken:
                case SyntaxKind.PercentToken: {
                    const receiver = info.isInverted ? right : left;
                    const arg = info.isInverted ? left : right;
                    const call = f.createCallExpression(
                        f.createPropertyAccessExpression(receiver, info.name as string),
                        undefined,
                        [arg]
                    );
                    // != and !== → negate the result: !a.equals(b)
                    if (info.isNegated) {
                        return f.createPrefixUnaryExpression(SyntaxKind.ExclamationToken, call);
                    }
                    return call;
                }
                case SyntaxKind.PlusEqualsToken:
                case SyntaxKind.MinusEqualsToken:
                case SyntaxKind.AsteriskEqualsToken:
                case SyntaxKind.SlashEqualsToken:
                case SyntaxKind.PercentEqualsToken:
                case SyntaxKind.CaretEqualsToken: {
                    // a += b → a = a.plus(b)
                    const receiver = info.isInverted ? right : left;
                    const arg = info.isInverted ? left : right;
                    const call = f.createCallExpression(
                        f.createPropertyAccessExpression(receiver, info.name as string),
                        undefined,
                        [arg]
                    );
                    return f.createAssignment(left, call);
                }
            }
        }
    }

    if (isPrefixUnaryExpression(node)) {
        const info = resolver.getResolvedOperatorInfo?.(node);
        if (info && info.isUnary) {
            const operand = visitNode(node.operand, visit) as Expression;
            return f.createCallExpression(
                f.createPropertyAccessExpression(operand, info.name as string),
                undefined,
                []
            );
        }
    }

    if (isElementAccessExpression(node)) {
        const info = resolver.getResolvedOperatorInfo?.(node);
        if (info && info.isAccess) {
            const expression = visitNode(node.expression, visit) as Expression;
            const argument = visitNode(node.argumentExpression, visit) as Expression;
            return f.createCallExpression(
                f.createPropertyAccessExpression(expression, info.name as string),
                undefined,
                [argument]
            );
        }
    }

    return visitEachChild(node, visit, context);
  };

  const transformSourceFile = (sf: SourceFile): SourceFile =>
    visitNode(sf, visit) as SourceFile;

  const transformBundle = (b: Bundle): Bundle =>
    f.createBundle(b.sourceFiles.map(transformSourceFile));

  return (node: SourceFile | Bundle): SourceFile | Bundle =>
    isSourceFile(node) ? transformSourceFile(node) : transformBundle(node);
}
