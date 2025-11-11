import { useEffect, useRef, useState } from "react";


//import "editable-antd-tree/dist/esm/output.css"; // load style
import { EditableAntdTree } from "editable-antd-tree";
import i18next from "i18next";


//https://github.com/ealexandros/editable-antd-tree
//npm install  editable-antd-tree --force






const AntTree = ({ unit }) => {

  let tree = [

  ];

  const createRootParentEvent = (e)=>{
  }

  const createParentEvent = (e)=>{
  }

  const createRootLeafEvent = (e)=>{
  }

  const createLeafEvent = (e)=>{
  }

  const deleteNodeEvent = (e)=>{
  }

  const updateNodeEvent = (e)=>{
  }

  const customConfig = () => {
    return {
      createRootParent: { caption: i18next.t('appTreeTranslation.createRootParent'), event: (e)=>{createRootParentEvent(e)}  },
      createParent: { caption: i18next.t('appTreeTranslation.createParent'), event: (e)=>{createParentEvent(e)}  },
      createRootLeaf: { caption: i18next.t('appTreeTranslation.createRootLeaf'), event: (e)=>{createRootLeafEvent(e)}  },
      createLeaf: { caption: i18next.t('appTreeTranslation.createLeaf'), event: (e)=>{createLeafEvent(e)}  },
      deleteNode: { caption: i18next.t('appTreeTranslation.deleteNode'), event: (e)=>{deleteNodeEvent(e)} },
      updateNode: { caption: i18next.t('appTreeTranslation.updateNode'), event: (e)=>{updateNodeEvent(e)}  }
    }
  }

 
  return (<EditableAntdTree
    size={"xl"}
    treeData={tree}    
    onTreeChange={(e) => { return false }}
    {...customConfig()} />)
}


export default AntTree;
