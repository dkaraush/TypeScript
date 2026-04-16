import { isIdentifier, isSourceFile } from "../factory/nodeTests";
import { Bundle, Identifier, Node, SourceFile, TransformationContext } from "../types";
import { visitEachChild, visitNode } from "../visitorPublic";

export function transformImplicitThis(context: TransformationContext) {
    const f = context.factory;
    const resolver = context.getEmitResolver();

    const visit = (node: Node): Node => {
        if (isIdentifier(node)) {
            const info = resolver.getImplicitThisInfo?.(node);
            if (info) {
                const receiver = info.isStatic && info.className
                    ? f.createIdentifier(info.className)
                    : f.createThis();
                return f.createPropertyAccessExpression(receiver, node as Identifier);
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
