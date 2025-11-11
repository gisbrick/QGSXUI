import { useEffect, useRef, useState } from "react";
import { Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Table, Tooltip, Tree, Upload } from "antd"
import i18next from "i18next";
import { CarryOutOutlined, CloseCircleTwoTone, DeleteOutlined, EditOutlined, FileAddOutlined, FolderAddOutlined, PlusOutlined, SaveOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Search from "antd/es/transfer/search";
import TextArea from "antd/es/input/TextArea";
import ForwardDirectoryTree from "antd/es/tree/DirectoryTree";
import ConfigParentComponent from "./configParentComponent";
import ConfigLeafComponent from "./configLeafComponent";


function AppConfComponent({ unit, config, setConf, permissions }) {


    let [treeData, setTreeData] = useState();

    let [expandedkeys, setExpandedkeys] = useState();

    let [configParent, setConfigParent] = useState();
    let [configLeaf, setConfigLeaf] = useState();
    let [parent, setParent] = useState();
    let [isNew, setIsNew] = useState();



    useEffect(() => {
        if (!config) config = []
        if (typeof config === 'string' || config instanceof String) config = JSON.parse(config)
        setTreeData(config)
    }, [])


    const saveParent = (tree) => {
        if (!isNew) {
            updateTree(tree)
        }
        else {
            let treeDataCopy = [...treeData]
            if (!parent) {
                treeDataCopy.push(tree)
            }
            else {
                let info = {}
                getTree(info, parent.key, treeDataCopy)
                if (!info.tree.children) info.tree.children = []
                info.tree.children.push(tree)
                //Si el padre no esta expandido, lo expandimos
                let expandedkeysCopy = expandedkeys ? [...expandedkeys] : []
                if (!(info.parent in expandedkeysCopy)) {
                    expandedkeysCopy.push(info.parent)
                    setExpandedkeys(expandedkeysCopy)
                }

            }
            setConfigParent(null)
            setTreeData(treeDataCopy)
            setConf(treeDataCopy)
        }
    }

    const saveLeaf = (tree) => {
        let treeDataCopy = [...treeData]
        if (!isNew) {
            updateTree(tree)
        }
        else {
            if (!parent) {
                treeDataCopy.push(tree)
            }
            else {
                if (!parent.children) parent.children = []
                parent.children.push(tree)

                let info = {}
                getTree(info, parent.key, treeDataCopy)
                if (info.tree) {
                    //Si el padre no esta expandido, lo expandimos
                    if (!expandedkeys) expandedkeys = []
                    if (!(info.tree.key in expandedkeys)) {
                        let expandedkeysCopy = [...expandedkeys]
                        expandedkeysCopy.push(info.tree.key)
                        setExpandedkeys(expandedkeysCopy)
                    }
                }

            }
        }

        setConfigLeaf(null)
        setTreeData(treeDataCopy)
        setConf(treeDataCopy)
    }

    const updateTree = (tree) => {
        let treeDataCopy = [...treeData]
        let info = {}
        getTree(info, tree.key, treeDataCopy)
        if (info.tree) info.tree = { ...tree }

        setConfigLeaf(null)
        setConfigParent(null)
        setTreeData(treeDataCopy)
        setConf(treeDataCopy)
    }

    const deleteTree = (tree) => {
        let treeDataCopy = [...treeData]
        let info = {}
        getTree(info, tree.key, treeDataCopy)

        if (info.tree) {
            if (info.parent) {
                let infoParent = {}
                getTree(infoParent, info.parent, treeDataCopy)
                const index = getIndexTree(infoParent.tree.children, tree.key)
                if (index > -1) { // only splice array when item is found
                    infoParent.tree.children.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
            else {
                const index = getIndexTree(treeDataCopy, tree.key)
                if (index > -1) { // only splice array when item is found
                    treeDataCopy.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
        }

        setTreeData(treeDataCopy)
        setConf(treeDataCopy)

        return treeDataCopy

        /*
        let newNodes = []
        const nodes = deleteNodeAux(newNodes, [...treeData], node)
        setTreeData(newNodes)
        setConf(newNodes)*/
    }

    const dragTree = (node, dragNode) => {


        let treeDataCopy = [...treeData]
        let infoNode = {}
        getTree(infoNode, node.key, treeDataCopy)
        let infoDragNode = {}
        getTree(infoDragNode, dragNode.key, treeDataCopy)

        if (infoNode.tree.type == "PARENT") {
            let newNode = { ...dragNode };
            //Borramos el nodo arrastrado
            treeDataCopy = deleteTree(dragNode)

            if (node.dragOverGapTop) {
                treeDataCopy.splice(0, 0, newNode);
            }
            else {
                //Añadimos el nodo en la posición 0 del padre
                infoNode.tree.children.splice(0, 0, newNode);
            }
        }
        else {

            let newNode = { ...dragNode };

            //Borramos el nodo arrastrado
            treeDataCopy = deleteTree(dragNode)

            if (node.dragOverGapTop) {
                treeDataCopy.splice(0, 0, newNode);
            }
            else {

                //Recuperamos el nuevo índice y el padre
                let previousNodeIndex = 0;
                let parentChildren;
                if (infoNode.parent) {
                    let infoParent = {}
                    getTree(infoParent, infoNode.parent, treeDataCopy)
                    previousNodeIndex = getIndexTree(infoParent.tree.children, node.key)
                    parentChildren = infoParent.tree.children
                }
                else {
                    previousNodeIndex = getIndexTree(treeDataCopy, node.key)
                    parentChildren = treeDataCopy
                }

                //Añadimos el nodo en la posición 0 del padre
                parentChildren.splice((parseInt(previousNodeIndex) + 1), 0, newNode);
            }

        }

        setTreeData(treeDataCopy)
        setConf(treeDataCopy)


        /*
        if(node.type == "PARENT") {
            let newNode =  {...dragNode};
             //Borramos el nodo arrastrado
             deleteTree(dragNode)
            //Añadimos el nodo en la posición 0 del padre
            node.children.splice(0, 0, newNode);
           
        }
        else{
            let newNode =  {...dragNode};
            //Borramos el nodo arrastrado
            deleteTree(dragNode)
           //Añadimos el nodo en la siguiente posición del  Node
           node.children.splice((nodeIndex + 1), 0, newNode);
        }
        setTreeData(treeDataCopy)
        setConf(treeDataCopy)
        */
    }

    const getTree = (out, key, list, parent, success) => {
        for (let i in list) {

            let item = list[i]

            if (!success && item.key == key) {
                success = true
                out.tree = list[i]
                out.parent = parent ? parent.key : null
            }
            if (!success && "children" in item && item.children.length > 0) {
                getTree(out, key, item.children, item, success)
            }
        }
    }

    const getIndexTree = (nodeList, key) => {
        let i = -1
        for (let n in nodeList) {
            if (nodeList[n].key == key) {
                i = n
            }
        }
        return i
    }

    let renderParentToolbar = (nodeData) => {
        return <>&nbsp; &nbsp; <Space wrap>
            <Tooltip title={i18next.t('common.actions.delete.name')}>
                <DeleteOutlined onClick={(e) => { deleteTree(nodeData); e.stopPropagation(); }} />
            </Tooltip>
            <Tooltip title={i18next.t('common.actions.edit.name')}>
                <EditOutlined onClick={(e) => { setIsNew(false); updateNode(nodeData); e.stopPropagation(); }} />
            </Tooltip>
            <Tooltip title={i18next.t('manager.app.appTree.createParent')}>
                <FolderAddOutlined onClick={(e) => { createParent(nodeData); e.stopPropagation(); }} />
            </Tooltip>
            <Tooltip title={i18next.t('manager.app.appTree.createLeaf')}>
                <PlusOutlined onClick={(e) => { createLeaf(nodeData); e.stopPropagation(); }} />
            </Tooltip>
        </Space >
        </>
    }
    let renderLeafToolbar = (nodeData) => {
        return <>&nbsp; &nbsp; <Space wrap>
            <Tooltip title={i18next.t('common.actions.delete.name')}>
                <DeleteOutlined onClick={(e) => { deleteTree(nodeData); e.stopPropagation(); }} />
            </Tooltip>
            <Tooltip title={i18next.t('common.actions.edit.name')}>
                <EditOutlined onClick={(e) => { setIsNew(false); updateNode(nodeData); e.stopPropagation(); }} />
            </Tooltip>
        </Space >
        </>
    }

    let titleRender = (nodeData) => {
        //setParent(nodeData.parent)
        if (nodeData.type == "PARENT") {
            return <>{nodeData.title} {renderParentToolbar(nodeData)}</>
        }
        if (nodeData.type == "LEAF") {
            return <>{nodeData.title} {renderLeafToolbar(nodeData)}</>
        }

    }

    const createRootParent = () => {
        setIsNew(true)
        setParent(null)
        setConfigLeaf(null)
        setConfigParent({})
    }

    const createRootLeaf = () => {
        setIsNew(true)
        setParent(null)
        setConfigLeaf({})
        setConfigParent(null)
    }

    const createParent = (parent) => {
        setIsNew(true)
        setParent(parent)
        setConfigLeaf(null)
        setConfigParent({})
    }

    const createLeaf = (parent) => {
        setIsNew(true)
        setParent(parent)
        setConfigLeaf({})
        setConfigParent(null)
    }



    const updateNode = (nodeData) => {
        if (nodeData.type == "PARENT") {
            setConfigParent(nodeData)
        }
        if (nodeData.type == "LEAF") {
            setConfigLeaf(nodeData)
        }
    }

    const onExpand = (e) => {
        setExpandedkeys(e)
    }

    let actions = {
        createRootParentEvent: createRootParent,
        createParentEvent: createParent,
        createRootLeafEvent: createRootLeaf,
        createLeafEvent: createLeaf,
        deleteNodeEvent: deleteTree,
        updateNodeEvent: updateNode

    }

    return (
        <>
            <Card
                title={<div className="reader">{i18next.t('manager.app.config')}</div>}
                size="small"
                bordered={true}
                style={{}}>

                <Row justify={"start"}>
                    <div>
                        <div style={{ display: "inline-block", padding:"5px" }}>
                            <Button type="primary"  onClick={createRootParent}>
                                <Space>
                                <FolderAddOutlined />
                                <div className="reader">{i18next.t('manager.app.appTree.createRootParent')}</div>
                                </Space>

                            </Button>
                        </div>
                        <div style={{ display: "inline-block", padding:"5px" }}>
                            <Button type="primary" onClick={createRootLeaf}>
                                <Space>
                                <PlusOutlined />
                                <div className="reader">{i18next.t('manager.app.appTree.createRootLeaf')}</div>
                                </Space>

                            </Button>
                        </div>
                    </div>
                </Row>

                {/*treeData && JSON.stringify(treeData)*/}


                {treeData?.length>0 && <Card
                    size="small"
                    bordered={true}
                    style={{}}>
                    <ForwardDirectoryTree
                        multiple
                        defaultExpandAll={true}
                        defaultExpandedKeys={expandedkeys}
                        onExpand={onExpand}
                        treeData={treeData}
                        draggable={true}
                        selectable={false}
                        titleRender={titleRender}
                        onDragEnd={({ event, node }) => {

                        }}
                        onDrop={({ event, node, dragNode, dragNodesKeys }) => {
                            dragTree(node, dragNode)
                        }}

                    />
                </Card>}


            </Card>
            {configParent && <ConfigParentComponent unit={unit} config={configParent} isNew={isNew} setSelect={setConfigParent} saveParent={saveParent} permissions={permissions} />}
            {configLeaf && <ConfigLeafComponent unit={unit} config={configLeaf} isNew={isNew} setSelect={setConfigLeaf} saveLeaf={saveLeaf} permissions={permissions} />}
        </>
    );
}

export default AppConfComponent;