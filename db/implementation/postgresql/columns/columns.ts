import {eDBColumn, DBColumnDef, eDBColumnAttr} from "../../../abstraction/columns/columns";

function getColAttr(attr:eDBColumnAttr):string {
    switch (attr) {
        case eDBColumnAttr.AutoIncrement:
            return "A"
    }
}

export function getColumn(colDef:DBColumnDef):string {
    var col = [];
    switch (colDef.colType) {
        case eDBColumn.Integer:
            col.push("integer");
            break;
        case eDBColumn.VarChar:
            col.push("varchar");
            if (colDef.precision > 0) {
                col.push(`(${colDef.precision}`);
            }
            break;
        case eDBColumn.Boolean:
            col.push("boolean");
            break;
        case eDBColumn.TimeStamp:
            col.push("timestamp");
            break;
        default:
            throw `column type ${colDef.colType} is not implemented yet`;
    }
    if (colDef.colAttrs.length > 0) {

    }
    col.push(",");
    return col.join(" ");
}