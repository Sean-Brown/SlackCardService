/**
 * Generic SQL data types ala w3schools:
 * http://www.w3schools.com/sql/sql_datatypes_general.asp
 */
export enum eDBColumn {
    /** Character string with fixed length */
    Character,

    /** Variable length character string */
    VarChar,

    /** Binary string with a fixed length */
    Binary,

    /** Variable length binary string */
    VarBinary,

    /** Stores true-false values */
    Boolean,

    /** Integer type with a given precision 'P' */
    IntegerP,

    /** Integer type with precision 5 */
    SmallInt,

    /** Integer type with precision 10 */
    Integer,

    /** Integer type with precision 19 */
    BigInt,

    /**
     * Decimal values with given precision 'P' and scale 'S'
     * For example, P=5 S=2 is a number with 3 digits before
     * the decimal and 2 digits after the decimal
     */
    Decimal,

    /** Analogous to Decimal, with given precision 'P' and scale 'S' */
    Numeric,

    /** Approximate numerical with given mantissa precision 'P', the minimum precision */
    FloatP,

    /** Approximate numerical with mantissa precision 7 */
    Real,

    /** Approximate numerical with mantissa precision 16 */
    Float,

    /** Approximate numerical with mantissa precision 16 */
    DoublePrecision,

    /** Stores year, month, and day values */
    Date,

    /** Stores hour, minute, second values */
    Time,

    /** Stores year, month, day, hour, minute, and second values */
    TimeStamp,

    /**
     * Composed of a number of integer fields representing a period of
     * time depending on the type of interval
     */
    Interval,

    /** Set-length and ordered collection of elements */
    Array,

    /** Variable-length and unordered collection of elements */
    Multiset,

    /** Stores XML data */
    Xml,
}

export enum eDBColumnAttr {
    AutoIncrement,
    Unique,
    NotNull,
    Default,
    PrimaryKey,
    ForeignKey,
    References,
    Check
}

export class DBColumnAttr {
    colAttr: eDBColumnAttr;
    args: Array<any>;
    constructor(colAttr, args=[]) {
        this.colAttr = colAttr;
        this.args = args;
    }
}

export class DBColumnDef {
    name: string;
    colType: eDBColumn;
    colAttrs: Array<DBColumnAttr>;
    precision: number;
    scale: number;
    constructor(
        name: string,
        colType: eDBColumn,
        attrs: Array<DBColumnAttr>=[],
        precision: number=0,
        scale: number=0
    ){
        this.name = name;
        this.colType = colType;
        this.colAttrs = attrs;
        this.precision = precision;
        this.scale = scale;
    }
}
