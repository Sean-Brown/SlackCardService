export function getErrorMessage(errors:Array<string>):string {
    return errors.join("\n").replace(/\n$/, "");
}