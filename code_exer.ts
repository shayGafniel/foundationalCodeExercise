import baseSample from './inputs/base_sample.json'
import wildcardSample from './inputs/wildcard_sample.json'
import advancedCardSample from './inputs/advanced_sample.json'

import * as fs from 'fs';
import { Column, Table, Edge } from './models'

const writeFileWithcontent = (fileName: string, content: string) => {
    fs.writeFile(fileName, content, (err: any) => {
        if (err) {
            console.error('Error creating file:', err);
        } else {
            console.log('File created successfully!');
        }
    });
}

const filterEdgesByConfidence = (maxConf: number, edges: Edge[]) => {
    return edges.filter((edge: any) => edge.confidence > maxConf)
}

const filterEdgesByExictensInTables = (tables: Table[], edges: Edge[]) => {
    return edges.map((edge: Edge) => {
        const isConfidenceHigh = tables.some((table: Table) => {
            return table.table_name == edge.src_column.table_name &&
                table.columns.some((column: Column) => {
                    return column.col_name == edge.src_column.col_name
                })
        })
        return { ...edge, confidence: isConfidenceHigh ? 1 : edge.confidence }
    })
}

const createEdgesOnAstrics = (tables: Table[], edge: Edge): Edge[] => {
    const newEdges: Edge[] = []
    const edgeSrcTable = tables.find((table: Table) => { return table.table_name == edge.src_column.table_name })
    const edgeDstTable = tables.find((table: Table) => { return table.table_name == edge.dst_column.table_name })
    const edgeSrcTableRelevantCols = edgeSrcTable?.columns.filter((srcCol: Column) => {
        return edgeDstTable?.columns.some((dstCol: Column) => {
            return dstCol.col_name == srcCol.col_name
        })
    })
    edgeSrcTableRelevantCols?.forEach((col: Column) => {
        newEdges.push({
            "src_column": {
                "table_name": edge.src_column.table_name,
                "col_name": col.col_name
            },
            "dst_column": {
                "table_name": edge.dst_column.table_name,
                "col_name": col.col_name
            },
            "confidence": edge.confidence
        })
    });

    return newEdges
}


const main = () => {
    const edges = baseSample.edges
    const tables = baseSample.tables

    const levelOnefilteredEdges = filterEdgesByConfidence(0.5, edges)
    writeFileWithcontent("levelOne.json", JSON.stringify({ tables: tables, edges: levelOnefilteredEdges }))


    const levelTwoFilteredEdges = filterEdgesByExictensInTables(tables, edges)
    writeFileWithcontent("levelTwo.json", JSON.stringify({ tables: tables, edges: filterEdgesByConfidence(0.5, levelTwoFilteredEdges) }))


    const wildEdges = wildcardSample.edges
    const wildTables = wildcardSample.tables

    const astricsEdges = wildEdges.filter((edge: Edge) => edge.dst_column.col_name == "*" && edge.src_column.col_name == "*")
    const edgesWithoutAstrixes = wildEdges.filter((edge: Edge) => edge.dst_column.col_name != "*" && edge.src_column.col_name != "*")
    const expandedEdges = [...edgesWithoutAstrixes, ...astricsEdges.flatMap((edge: Edge) => createEdgesOnAstrics(wildTables, edge))]
    writeFileWithcontent("levelThree.json", JSON.stringify({ tables: wildTables, edges: expandedEdges }))


    // const advancedEdges = advancedCardSample.edges
    // const advancedTables = advancedCardSample.tables
    // const advancedstricsEdges = advancedEdges.filter((edge: Edge) => edge.dst_column.col_name == "*" && edge.src_column.col_name == "*")
    // const advancedEdgesWithoutAstrixes = advancedEdges.filter((edge: Edge) => edge.dst_column.col_name != "*" && edge.src_column.col_name != "*")

    //calc missing tables
    // how i would calculate the tables:
    // go threw the edges whit high confidence and without the astrixes.
    // find all the edges that contain table names that are not in the table list. (skip this step if coloums on existing tables might not exist)
    // break the edges into small tuples of table name and conloum name.
    // iterate threw the tuples and add coulums to the right tables 


    // when having all tables, use level 3 function to expand the astrixes edges,
    // run level 2 code to get confidence of the edges, then level one to eliminate low confidence edges.

    // as following:
    // const advancedExpandedEdges = [...advancedEdgesWithoutAstrixes, ...advancedstricsEdges.map((edge: Edge) => createEdgesOnAstrics(advancedTables, edge))]
    // const onlyExistingEdges = filterEdgesByExictensInTables(advancedTables, advancedExpandedEdges as Edge[])
    // writeFileWithcontent("levelfour.json", JSON.stringify({ tables: advancedTables, edges: filterEdgesByConfidence(0.5, onlyExistingEdges) }))
}



main();



