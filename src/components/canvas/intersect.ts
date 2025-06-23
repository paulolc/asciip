import { Coords, Shape, Rectangle } from "../../models/shapes";
import { ShapeObject } from "../../store/diagramSlice";

export function getIntersectionsChars(allshapes: ShapeObject[] | Shape[] ){
    let shapes:ShapeObject[] = [];
    allshapes.forEach(s => { if(isShapeObject(s)) shapes.push(s) });
    shapes.reverse();

    let allIntersectionPointsChars: { r: number; c: number; char: string ; }[] = [];
    while( shapes.length > 1 ){
        let currshape : ShapeObject = shapes.shift()!;
        if(currshape){
            shapes.forEach( (shape: ShapeObject ) => {
                const currrectIntersectionChars = rectIntersectionChars(currshape,shape);
                if( currrectIntersectionChars) allIntersectionPointsChars.push( ...currrectIntersectionChars )
            });
        }
    }
    return allIntersectionPointsChars.filter(p=>p.char);
}

function rectIntersectionChars(rect1: ShapeObject, rect2: ShapeObject) {

    // Only RECTANGLE shapes are supported for now
    const r1 = rect1.shape as Rectangle;
    const r2 = rect2.shape as Rectangle;
    if( r1.type !== "RECTANGLE" || r2.type !== "RECTANGLE"){
        return []
    }
    
    // Extract coordinates (r = x, c = y)
    const rect1Coords = {
        left: r1.tl.c,
        top: r1.tl.r,
        right: r1.br.c,
        bottom: r1.br.r
    };
    
    const rect2Coords = {
        left: r2.tl.c,
        top: r2.tl.r,
        right: r2.br.c,
        bottom: r2.br.r
    };
    
    // Check if rectangles overlap
    const overlap = !(rect1Coords.right < rect2Coords.left || 
                     rect2Coords.right < rect1Coords.left || 
                     rect1Coords.bottom < rect2Coords.top || 
                     rect2Coords.bottom < rect1Coords.top);
    
    let  rectIntersectionChars: { r: number; c: number; char: string; }[] = [];
    // Calculate intersection if they overlap
    if (overlap) {
        const intersectLeft = Math.max(rect1Coords.left, rect2Coords.left);
        const intersectTop = Math.max(rect1Coords.top, rect2Coords.top);
        const intersectRight = Math.min(rect1Coords.right, rect2Coords.right);
        const intersectBottom = Math.min(rect1Coords.bottom, rect2Coords.bottom);
        
        const ir = {
            tl: { r: intersectTop, c: intersectLeft },
            tr: { r: intersectTop, c: intersectRight},
            bl: { r: intersectBottom, c: intersectLeft},
            br: { r: intersectBottom, c: intersectRight  }
        };
       rectIntersectionChars = Object.values(ir)
            .map( p => ({ r: p.r , c: p.c , char: intersectionPointChar(p,rect1,rect2) }) )
            .filter( p => p.char !== "" ); 
    }

    return rectIntersectionChars;
}

function intersectionPointChar( p: Coords , r1: ShapeObject, r2: ShapeObject ):string {

    const { r: p_r, c: p_c } = p;
    const pointInR1 = pointInRectPerimeter( p, r1 );
    const pointInR2 = pointInRectPerimeter( p, r2 );
    
    const isIntersectionPoint = pointInR1 && pointInR2;

    if( isIntersectionPoint ){
        const aboveP = { r: p_r - 1 , c: p_c } ;
        const belowP = { r: p_r + 1 , c: p_c } ;
        const rightP = { r: p_r , c: p_c + 1 } ;
        const leftP  = { r: p_r , c: p_c - 1 } ;

        const aboveT = pointLineType( aboveP, r1, r2 );
        const belowT = pointLineType( belowP, r1, r2 );
        const rightT = pointLineType( rightP, r1, r2 );
        const leftT  = pointLineType( leftP, r1, r2 );

        const c : string = `${leftT},${aboveT},${rightT},${belowT}`;        
        return BOXCHARS.get(c)!;

    } else return ""
    
}

function pointInRectPerimeter(testPoint: Coords, shape: ShapeObject ){

    const rect = shape.shape as Rectangle;
    const { r: p_r, c: p_c } = testPoint;
    const { r: tl_r, c: tl_c } = rect.tl;
    const { r: br_r, c: br_c } = rect.br;

    const min_r = Math.min(tl_r, br_r);
    const max_r = Math.max(tl_r, br_r);
    const min_c = Math.min(tl_c, br_c);
    const max_c = Math.max(tl_c, br_c);

    const onLeftEdge = (p_r === min_r) && (p_c >= min_c && p_c <= max_c);
    const onRightEdge = (p_r === max_r) && (p_c >= min_c && p_c <= max_c);
    const onBottomEdge = (p_c === min_c) && (p_r >= min_r && p_r <= max_r);
    const onTopEdge = (p_c === max_c) && (p_r >= min_r && p_r <= max_r);   

    const onVerticalEdge = ( onLeftEdge || onRightEdge ); 
    const onHorizontalEdge = ( onBottomEdge || onTopEdge ); 

    return  ( onVerticalEdge || onHorizontalEdge ) 
}

function pointLineType( p: Coords, r1: ShapeObject, r2: ShapeObject ){
    return ( pointInRectPerimeter(p,r1) ? r1.style?.lineStyle : 
                pointInRectPerimeter(p,r2) ? r2.style?.lineStyle : 
                    "NONE" );
}


function isShapeObject(shape: ShapeObject | Shape): shape is ShapeObject {
    return "id" in shape;
}


const BOXCHARS = new Map(Object.entries({
    "NONE,LIGHT,LIGHT,LIGHT": "├",
    "NONE,LIGHT,HEAVY,LIGHT": "┝",
    "NONE,HEAVY,LIGHT,LIGHT": "┞",
    "NONE,LIGHT,LIGHT,HEAVY": "┟",
    "NONE,HEAVY,LIGHT,HEAVY": "┠",
    "NONE,HEAVY,HEAVY,LIGHT": "┡",
    "NONE,LIGHT,HEAVY,HEAVY": "┢",
    "NONE,HEAVY,HEAVY,HEAVY": "┣",
    "LIGHT,LIGHT,NONE,LIGHT": "┤",
    "HEAVY,LIGHT,NONE,LIGHT": "┥",
    "LIGHT,HEAVY,NONE,LIGHT": "┦",
    "LIGHT,LIGHT,NONE,HEAVY": "┧",
    "LIGHT,HEAVY,NONE,HEAVY": "┨",
    "HEAVY,HEAVY,NONE,LIGHT": "┩",
    "HEAVY,LIGHT,NONE,HEAVY": "┪",
    "HEAVY,HEAVY,NONE,HEAVY": "┫",
    "LIGHT,NONE,LIGHT,LIGHT": "┬",
    "HEAVY,NONE,LIGHT,LIGHT": "┭",
    "LIGHT,NONE,HEAVY,LIGHT": "┮",
    "HEAVY,NONE,HEAVY,LIGHT": "┯",
    "LIGHT,NONE,LIGHT,HEAVY": "┰",
    "HEAVY,NONE,LIGHT,HEAVY": "┱",
    "LIGHT,NONE,HEAVY,HEAVY": "┲",
    "HEAVY,NONE,HEAVY,HEAVY": "┳",
    "LIGHT,LIGHT,LIGHT,NONE": "┴",
    "HEAVY,LIGHT,LIGHT,NONE": "┵",
    "LIGHT,LIGHT,HEAVY,NONE": "┶",
    "HEAVY,LIGHT,HEAVY,NONE": "┷",
    "LIGHT,HEAVY,LIGHT,NONE": "┸",
    "HEAVY,HEAVY,LIGHT,NONE": "┹",
    "LIGHT,HEAVY,HEAVY,NONE": "┺",
    "HEAVY,HEAVY,HEAVY,NONE": "┻",
    "LIGHT,LIGHT,LIGHT,LIGHT": "┼",
    "HEAVY,LIGHT,LIGHT,LIGHT": "┽",
    "LIGHT,LIGHT,HEAVY,LIGHT": "┾",
    "HEAVY,LIGHT,HEAVY,LIGHT": "┿",
    "LIGHT,HEAVY,LIGHT,LIGHT": "╀",
    "LIGHT,LIGHT,LIGHT,HEAVY": "╁",
    "LIGHT,HEAVY,LIGHT,HEAVY": "╂",
    "HEAVY,HEAVY,LIGHT,LIGHT": "╃",
    "LIGHT,HEAVY,HEAVY,LIGHT": "╄",
    "HEAVY,LIGHT,LIGHT,HEAVY": "╅",
    "LIGHT,LIGHT,HEAVY,HEAVY": "╆",
    "HEAVY,HEAVY,HEAVY,LIGHT": "╇",
    "HEAVY,LIGHT,HEAVY,HEAVY": "╈",
    "HEAVY,HEAVY,LIGHT,HEAVY": "╉",
    "LIGHT,HEAVY,HEAVY,HEAVY": "╊",
    "HEAVY,HEAVY,HEAVY,HEAVY": "╋",
    "NONE,LIGHT,DOUBLE,LIGHT": "╞",
    "NONE,DOUBLE,LIGHT,DOUBLE": "╟",
    "NONE,DOUBLE,DOUBLE,DOUBLE": "╠",
    "DOUBLE,LIGHT,NONE,LIGHT": "╡",
    "LIGHT,DOUBLE,NONE,DOUBLE": "╢",
    "DOUBLE,DOUBLE,NONE,DOUBLE": "╣",
    "DOUBLE,NONE,DOUBLE,LIGHT": "╤",
    "LIGHT,NONE,LIGHT,DOUBLE": "╥",
    "DOUBLE,NONE,DOUBLE,DOUBLE": "╦",
    "DOUBLE,LIGHT,DOUBLE,NONE": "╧",
    "LIGHT,DOUBLE,LIGHT,NONE": "╨",
    "DOUBLE,DOUBLE,DOUBLE,NONE": "╩",
    "DOUBLE,LIGHT,DOUBLE,LIGHT": "╪",
    "LIGHT,DOUBLE,LIGHT,DOUBLE": "╫",
    "DOUBLE,DOUBLE,DOUBLE,DOUBLE": "╬",

// alternative replacements due to missing UNICODE box characters    
    "HEAVY,DOUBLE,HEAVY,NONE": "╨",
    "LIGHT,LIGHT,DOUBLE,DOUBLE": "╆",
    "HEAVY,DOUBLE,HEAVY,DOUBLE": "╫",
    "HEAVY,HEAVY,DOUBLE,DOUBLE": "╫",
    "DOUBLE,HEAVY,DOUBLE,HEAVY": "╪"
}));
