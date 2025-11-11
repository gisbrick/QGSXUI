import { useState, useEffect } from "react";
import RichTextEditor from 'react-rte';



const HtmlEditor = ({ editable, htmlValue, setHtmlValue, value, onChange }) => {

    const [html, setHtml] = useState();

    //let html = RichTextEditor.createValueFromString(htmlValue, 'html');

    const toolbarConfig = {
        display: ['INLINE_STYLE_BUTTONS', 'LINK_BUTTONS', 'BLOCK_TYPE_BUTTONS'],
        INLINE_STYLE_BUTTONS: [
            { label: 'Bold', style: 'BOLD', className: 'custom-css-class' },
            { label: 'Italic', style: 'ITALIC' },
        ],
        LINK_BUTTONS: [{ label: 'Add Link', style: 'link' }],
    };

    useEffect(() => {
        console.log("htmlvalur", htmlValue)
        if (!htmlValue) htmlValue = "";
        setHtml(RichTextEditor.createValueFromString(htmlValue, 'html'))
        //console.log("html", html)
    }, [])

    return (
        <>
            {html &&
                <RichTextEditor
                    value={html/*RichTextEditor.createValueFromString(html, 'html')*/}
                    readOnly={!editable}
                    onChange={(value) => {
                        //if(setHtmlValue)setHtmlValue(value.toString('html'))
                        if (onChange) onChange(value.toString('html'))
                        setHtml(value)

                        //setHtml(value.toString('html'))
                        /*
                        setHtml(value.toString('html'))
                        if(setValue)setValue(value.toString('html'))*/
                    }}>
                </RichTextEditor>}
        </>
    )
}

export default HtmlEditor;