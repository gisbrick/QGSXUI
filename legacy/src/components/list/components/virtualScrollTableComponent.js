import { useEffect, useRef, useState } from "react";
import LoadingComponent from "../../utils/LoadingComponent";

import { Space, Table, Col, Row, Tooltip, theme, Dropdown, Spin, ConfigProvider } from 'antd';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import { VariableSizeGrid as Grid } from 'react-window';
import { QgisService } from "../../../service/qgisService";
import ValueComponet from "../../values/valueComponet";
import i18next from "i18next";
import '../listComponent.css'
import RowActionButtonsComponent from "./rowActionButtonsComponent";
import { DeleteOutlined, EditOutlined, EyeOutlined, LoadingOutlined, SelectOutlined, ZoomInOutlined } from "@ant-design/icons";
import TableToolbarComponent from "./tableToolbarComponent";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../../features/generalParams/generalParamsSlice";
import { getBackgroundColorPrimary } from "../../../utilities/paramsUtils";




function VirtualScrollTableComponent({ fieldsValueRelations, map, QGISPRJ, layer, qgisLayer, count, totalCount, reload, mapView, columns, scroll, virtualData, tableActions, selection, tourStepsToolbar, setTourStepsToolbar, setTourStepsRow }) {

    const state_params = useSelector(generalParams_state)

    const { token } = theme.useToken();

    const [dataSource, setDataSource] = useState();
    let dataSourceAux = { ...virtualData };
    const [virtualColumns, setVirtualColumns] = useState();
    const [mergedColumns, setMergedColumns] = useState([]);
    const [resizingColumnIndex, _setResizingColumnIndex] = useState();
    const [tableWidth, setTableWidth] = useState(0);
    const [colorbackground, setColorBackground] = useState(token.colorBgContainer)

    const gridRef = useRef();
    const resizingColumnIndexRef = useRef(resizingColumnIndex);

    const [stepsToolbarRow, setStepsToobarRow] = useState([])
    const refRow = useRef()
    let indexesDataRequested = [];


    //Configura el menú de contexto en base a las capacidades del servicio
    let items = [
        {
            label: <Space wrap><SelectOutlined />{i18next.t('common.actions.select.commute')}</Space>,
            key: 'select',
        }
    ];
    if (mapView && qgisLayer.has_geometry) {
        items.push({
            label: <Space wrap><ZoomInOutlined />{i18next.t('common.actions.zoom.name')}</Space>,
            key: 'zoom',
        })
    }
    if (qgisLayer.WFSCapabilities.allowQuery) {
        items.push({
            label: <Space wrap><EyeOutlined />{i18next.t('common.actions.view.name')}</Space>,
            key: 'view',
        })
    }
    if (qgisLayer.WFSCapabilities.allowUpdate) {
        items.push({
            label: <Space wrap><EditOutlined />{i18next.t('common.actions.edit.name')}</Space>,
            key: 'update',
        })
    }
    if (qgisLayer.WFSCapabilities.allowDelete) {
        items.push({
            label: <Space wrap><DeleteOutlined />{i18next.t('common.actions.delete.name')}</Space>,
            key: 'delete',
        })
    }

    const contextMenuAction = (action, feature, rowIndex) => {
        //Quitamos las celldas como seleccionadas
        const cells = document.getElementsByClassName(`cell--hover${rowIndex}`);
        if (cells.length > 0) {
            for (const cell of cells) { cell.classList.remove('tablegrid__rowselected'); }
        }
        tableActions[action](feature)
    }

    const [connectObject] = useState(() => {
        const obj = {};
        Object.defineProperty(obj, 'scrollLeft', {
            get: () => {
                if (gridRef.current) {
                    return gridRef.current?.state?.scrollLeft;
                }
                return null;
            },
            set: (scrollLeft) => {
                if (gridRef.current) {
                    gridRef.current.scrollTo({
                        scrollLeft,
                    });
                }
            },
        });
        return obj;
    });

    const resetColumns = () => {
        if (!virtualColumns) return;

        const widthColumnCount = virtualColumns.filter(({ width }) => !width).length;
        let totalColumsWith = 0;

        let mergedColumnsAux = virtualColumns.map((column, index) => {
            let out = { ...column }
            let resizeHandleStyle = {
                position: "absolute",
                width: "10px",
                height: "100%",
                bottom: "0",
                right: "-5px",
                cursor: "col-resize",
                zIndex: "5"
            }

            const setResizingColumnIndex = (index) => {
                resizingColumnIndexRef.current = index;
                _setResizingColumnIndex(index);
            };

            const handleResize = (resizingColumnIndexRef, e) => {

                columns[resizingColumnIndexRef].width = columns[resizingColumnIndexRef].width + (e);
                let w = tableWidth + (e);
                setTableWidth(w)
                resetColumns();

            }

            const resizeListener = (e) => {
                if (resizingColumnIndexRef.current) {
                    handleResize(resizingColumnIndexRef.current, e.movementX);
                }

                window.onmouseup = (e) => {
                    window.removeEventListener("mousemove", resizeListener);
                    setResizingColumnIndex(undefined);
                };
            };


            const renderSort = () => {

                if (out['dataIndex'] == qgisLayer.sortby && qgisLayer.sortType == "ASC") {
                    return <span onClick={(e) => {
                        qgisLayer.addSort(out['dataIndex'], 'DESC')
                        reset();
                    }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
                }
                else if (out['dataIndex'] == qgisLayer.sortby && qgisLayer.sortType == "DESC") {
                    return <span onClick={(e) => {
                        qgisLayer.addSort(out['dataIndex'], 'ASC')
                        reset();
                    }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
                }
                else {
                    return <span onClick={(e) => {
                        qgisLayer.addSort(out['dataIndex'], 'ASC')
                        reset();
                    }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
                }
            }


            if (!out.width) {
                out["width"] = Math.floor(tableWidth / widthColumnCount);
            }

            //Hacemos una columna resizable
            let overflowEllipsisStyle = {
                whiteSpace: "nowrap",
                width: out["width"] - 10,
                overflow: "hidden",
                textOverflow: "ellipsis"
            }
            out['title'] = (
                <>
                    <div style={{display:"flex", flexDirection:"row"}}>
                    <div style={overflowEllipsisStyle}>
                        {out['title']}
                    </div>
                    {out['dataIndex'] &&
                        <div style={{ position: "absolute", width: "10px", height: "100%", right: "10px", cursor: "pointer", zIndex: "5" }} >
                            {renderSort(out)}
                        </div>
                    }
                    <div
                        style={resizeHandleStyle}
                        onMouseDown={() => {
                            setResizingColumnIndex(index);
                            window.addEventListener("mousemove", resizeListener, { passive: true });
                        }}>
                    </div>
                    </div>

                </>
            )

            totalColumsWith = totalColumsWith + out["width"];

            //Si es la última coumna, gestionamos la anchura de otra manera
            if (index == (virtualColumns.length - 1)) {
                if (totalColumsWith < tableWidth) {
                    out["width"] = out["width"] + (tableWidth - totalColumsWith); //Ampliamos la anchura para que ocupe toda la tabla
                }
            }

            return out;

        });
        setMergedColumns(mergedColumnsAux);


    }

    const resetVirtualGrid = () => {
        gridRef.current?.resetAfterIndices({
            columnIndex: 0,
            shouldForceUpdate: true,
        });
    };

    const reset = () => {
        resetColumns();
        resetVirtualGrid();

        //Resteteamos los valores recuperados
        //Inicializamos los datos virtuales del listado (solo los índices)
        let dataAux = Array.from(
            {
                length: count.numberOfFeatures,
            },
            (_, key) => ({
                key,
            }),
        );
        setDataSource(dataAux);
    }

    useEffect(() => { help() }, [])

    useEffect(() => {
        if (state_params.length > 0) {

            let colorHeader = getBackgroundColorPrimary(state_params)

            if (colorHeader) {
                setColorBackground(colorHeader)
            }
        }
    }, [state_params])

    useEffect(() => {
        reset();
        setDataSource(virtualData);
        setVirtualColumns(columns);
    }, [tableWidth, virtualData]);

    useEffect(() => {
        let steps = [...stepsToolbarRow]
        setTourStepsRow(steps)
    }, [stepsToolbarRow])



    const help = () => {
        let steps = [];

        steps.push({
            title: i18next.t('common.tools.help.table.rowTools.tools.title'),
            description: i18next.t('common.tools.help.table.rowTools.tools.description'),
            target: () => refRow.current,
        })



        setStepsToobarRow(steps)
    }



    const renderValue = (rowIndex, columnIndex, style) => {

        if (typeof dataSource[rowIndex] === 'undefined') {
            dataSource[rowIndex] = { rowIndex }
        }
        if (!dataSource[rowIndex].feature) {
            return <LoadingComponent></LoadingComponent>
        }
        else {
            let key = mergedColumns[columnIndex].dataIndex;
            let field = qgisLayer.fields.find(f => f.name == key);
            let config = field ? JSON.parse(field.editorWidgetSetup.config).IsMultiline : false
            //console.log("field  ", field, "   config", config)
            let overflowEllipsisStyle = {
                whiteSpace: "nowrap",
                width: style.width - 20,
                overflow: "hidden",
                textOverflow: "ellipsis"
            }

            return (
                <>
                    {columnIndex == 0 && rowIndex == 0 ? <div ref={refRow}><RowActionButtonsComponent
                        map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} reload={reload}
                        mapView={mapView} index={rowIndex} feature={dataSource[rowIndex].feature}
                        tableActions={tableActions} selection={selection}
                        rowIndex={rowIndex}>
                    </RowActionButtonsComponent></div> : columnIndex == 0 && <RowActionButtonsComponent
                        map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} reload={reload}
                        mapView={mapView} index={rowIndex} feature={dataSource[rowIndex].feature}
                        tableActions={tableActions} selection={selection}
                        rowIndex={rowIndex}>
                    </RowActionButtonsComponent>}
                    {columnIndex > 0 &&
                        <>
                            {
                                !config || config == undefined ? <Tooltip title={
                                    <span>{<ValueComponet feature={dataSource[rowIndex].feature} fieldsValueRelations={fieldsValueRelations} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} tooltip={false}></ValueComponet>}</span>
                                }>
                                    <div style={overflowEllipsisStyle}>
                                        <ValueComponet feature={dataSource[rowIndex].feature} map={map} fieldsValueRelations={fieldsValueRelations} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} tooltip={true}></ValueComponet>
                                    </div>
                                </Tooltip> :
                                    <div style={overflowEllipsisStyle}>
                                        <ValueComponet map={map} fieldsValueRelations={fieldsValueRelations} feature={dataSource[rowIndex].feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} tooltip={true}></ValueComponet>
                                    </div>
                            }
                        </>
                    }

                </>
            )
        }
    };

    const onCellMouseEnter = (rowIndex, a, b) => {
        const cells = document.getElementsByClassName(`cell--hover${rowIndex}`);
        if (cells.length > 0) {
            for (const cell of cells) { cell.classList.add('tablegrid__cellhovered'); }
        }
    };


    const onCellMouseLeave = (rowIndex, a, b) => {
        const cells = document.getElementsByClassName(`cell--hover${rowIndex}`);
        if (cells.length > 0) {
            for (const cell of cells) { cell.classList.remove('tablegrid__cellhovered'); }
        }
    };


    const renderVirtualList = (rawData, { scrollbarSize, ref, onScroll }) => {
        ref.current = connectObject;
        const totalHeight = rawData.length * 54;
        return (
            <Grid
                ref={gridRef}
                className="virtual-grid"
                columnCount={mergedColumns.length}
                columnWidth={(index) => {
                    const { width } = mergedColumns[index];
                    return totalHeight > scroll?.y && index === mergedColumns.length - 1
                        ? width - scrollbarSize - 1
                        : width;
                }}
                height={scroll.y}
                rowCount={rawData.length}
                rowHeight={() => 54}
                width={tableWidth}
                onScroll={({ scrollLeft }) => {
                    onScroll({
                        scrollLeft,
                    });
                }}
            >
                {

                    ({ columnIndex, rowIndex, style }) => {

                        //Si la fila no tiene datos, hacemos la request para recuperarlos y asignarlos    
                        //Hacemos las peticiones de 20 en 20 registros, para mejorar rendimiento    
                        let requestedFeatures = 20;
                        if (rowIndex in dataSource && !dataSource[rowIndex].feature && !indexesDataRequested.includes(rowIndex)) {
                            let getRowData = async (rowIndex) => {
                                //Evaluamos si tenemos que hacer filtro por extensión del mapa
                                let bbox = null;
                                if (mapView && qgisLayer.filterByMap) {
                                    let mapBbox = mapView.getBounds();
                                    bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
                                }
                                //map, layer, maxFeatures, startIndex, expFilter, bbox, sortby
                                QgisService.GETFEATURES(map, layer, requestedFeatures, rowIndex, qgisLayer.filter, bbox, qgisLayer.sortby, qgisLayer.sortType)
                                    .then((data) => {
                                        //let dataSourceAux = { ...dataSource };                                       
                                        for (let n = 0; n < data.features.length; n++) {
                                            dataSourceAux[rowIndex + n].feature = data.features[n];
                                        }
                                        setDataSource(dataSourceAux);
                                    })
                                    .catch(err => {
                                        console.log("ERROR", err);
                                    })

                            }
                            for (let i = 0; i < requestedFeatures; i++) {
                                indexesDataRequested.push(rowIndex + i);
                            }

                            getRowData(rowIndex);
                        }

                        return (
                            <Dropdown menu={{ items, onClick: ({ key }) => { contextMenuAction(key, dataSource[rowIndex].feature, rowIndex) } }} trigger={['contextMenu']}
                                onOpenChange={(open) => {
                                    if (open) {
                                        const cells = document.getElementsByClassName(`cell--hover${rowIndex}`);
                                        if (cells.length > 0) {
                                            for (const cell of cells) { cell.classList.add('tablegrid__rowselected'); }
                                        }
                                    }
                                    else {
                                        const cells = document.getElementsByClassName(`cell--hover${rowIndex}`);
                                        if (cells.length > 0) {
                                            for (const cell of cells) { cell.classList.remove('tablegrid__rowselected'); }
                                        }
                                    }
                                }}>
                                <div
                                    onMouseEnter={() => onCellMouseEnter(rowIndex)}
                                    onMouseLeave={() => onCellMouseLeave(rowIndex)}
                                    className={classNames('virtual-table-cell', `cell--hover${rowIndex}`, {
                                        'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
                                    })}
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        padding: token.padding,
                                        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
                                        background: token.colorBgContainer,
                                    }}
                                >
                                    {
                                        //rawData[rowIndex][mergedColumns[columnIndex].dataIndex]
                                        renderValue(rowIndex, columnIndex, style)
                                    }
                                </div>
                            </Dropdown>
                        )
                    }
                }
            </Grid>
        );
    };


    return (
        <>
            {<div style={{ border: "1px solid", borderRadius: "5px", background: colorbackground }}><TableToolbarComponent map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer}
                count={count.numberOfFeatures} totalCount={totalCount} reload={reload} mapView={mapView}
                columns={columns} scroll={scroll} virtualData={virtualData} tableActions={tableActions}
                selection={selection} tourStepsToolbar={tourStepsToolbar} setTourStepsToolbar={setTourStepsToolbar}
            ></TableToolbarComponent></div>}
            <ResizeObserver
                onResize={({ width }) => {
                    setTableWidth(width);
                }}
            >
                <ConfigProvider
                    theme={{
                        components: {
                            Table: {
                                cellPaddingBlock: "5px"
                            },
                        },
                    }}
                >
                    <Table
                        dataSource={virtualData} scroll={scroll}
                        className="virtual-table"
                        columns={mergedColumns}
                        style={{ "--bg-color": colorbackground, marginTop: "5px" }}
                        pagination={false}
                        components={{
                            body: renderVirtualList,
                        }}
                    />
                </ConfigProvider>

            </ResizeObserver>
        </>
    )
}

export default VirtualScrollTableComponent;