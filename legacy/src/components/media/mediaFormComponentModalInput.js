import { Modal } from "antd";
import i18next from "i18next";
import {useRef} from "react"
import MediaFormComponentInput from "./mediaFormComponentInput";

const MediaFormComponentModalInput = ({ item, qgisLayer, visible, setVisible, files, setFiles, filesControlState, setFilesControlState}) => {
    const formRef = useRef(null);


    const handleCancel = () => {
      if (formRef.current) {
        formRef.current.imperativeHandleCancel()
      }
    }
  
    const getTitle = () => {
      if(item){
        return i18next.t('common.actions.media.edit', { layername: qgisLayer.name })
      }
      else{
        return i18next.t('common.actions.media.insert', { layername: qgisLayer.name })
      }    
    }
  
  
    const render = () => {
      return <Modal
        title={(<>{getTitle()}</>)}
        maskClosable={false}
        open={visible}
        footer={null}
        onCancel={handleCancel}>
  
        <MediaFormComponentInput ref={formRef} item={item}
          setVisible={setVisible} files={files} setFiles={setFiles}
          filesControlState={filesControlState} setFilesControlState={setFilesControlState}>
        </MediaFormComponentInput>
      </Modal>
    }
  
    return (
      <>
        {render()}
      </>
    );
}

export default MediaFormComponentModalInput;