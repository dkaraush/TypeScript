import { isCallExpression, isSourceFile } from "../factory/nodeTests";
import { Bundle, Expression, Node, SourceFile, SyntaxKind, TransformationContext } from "../types";
import { visitEachChild, visitNode } from "../visitorPublic";

export function transformImplicitLifts(context: TransformationContext) {
  const f = context.factory;
  const resolver = context.getEmitResolver();

  const visit = (node: Node): Node => {
    if (isCallExpression(node)) {
      const newArgs = node.arguments.map((arg) => {
        const sig = resolver.getImplicitLift(arg);
        if (!sig)
            return visitEachChild(arg, visit, context);

        return f.createArrowFunction(
          undefined, undefined, [], undefined,
          f.createToken(SyntaxKind.EqualsGreaterThanToken),
          visitEachChild(arg, visit, context) as Expression
        );
      });

      return f.updateCallExpression(
        node,
        visitEachChild(node.expression, visit, context) as Expression,
        node.typeArguments,
        newArgs
      );
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