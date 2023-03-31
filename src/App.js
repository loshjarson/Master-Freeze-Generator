import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import { PDFDocument } from 'pdf-lib'

//template object to order field value object before excel creation

const templateObject = {
    "SBS ID":null,
    "NAME":null,
    "DATE":null,
    "TECHNICIAN":null,
    "FREEZE PROC": null,
    "CENT EXT": null,
    "CENT LOT #": null,
    "CENT DATE": null,
    "FRZ EXT": null,
    "FRZ EXT LOT #": null,
    "FRZ EXT DATE": null,
    "ANTIBIOTIC 1": null,
    "ANTIBIOTIC 1 LEVEL": null,
    "ANTIBIOTIC 2": null,
    "ANTIBIOTIC 2 LEVEL": null,
    "COLL. TIME": null,
    "MOUNTS": null,
    "COLLECTOR": null,
    "P/M": null,
    "AV TYPE": null,
    "LINER L/D": null,
    "ROOM TEMP": null,
    "DAYS SEX REST": null,
    "G-F VOL": null,
    "G-VOL": null,
    "CONC X106": null,
    "TS X109": null,
    "SEMCOM": null,
    "I TOTMOT": null,
    "I PMOT": null,
    "I VAP": null,
    "I VCL": null,
    "I VSL": null,
    "I ALH": null,
    "I BCF": null,
    "I STR": null,
    "I LIN": null,
    "PC TOTMOT": null,
    "PC PMOT": null,
    "PC VAP": null,
    "PC VCL": null,
    "PC VSL": null,
    "PC ALH": null,
    "PC BCF": null,
    "PC STR": null,
    "PC LIN": null,
    "PT TOTMOT": null,
    "PT PMOT": null,
    "PT VAP": null,
    "PT VCL": null,
    "PT VSL": null,
    "PT ALH": null,
    "PT BCF": null,
    "PT STR": null,
    "PT LIN": null,
    "MOT COM": null,
    "%RECTOT": null,
    "%RECPMOT": null,
    "%RECVAP": null,
    "%RECVAP": null,
    "%RECVCL": null,
    "%RECVSL": null,
    "%RECALH": null,
    "%RECBCF": null,
    "%RECSTR": null,
    "%RECLIN": null,
    "PROC VOL": null,
    "DIL 1 VOL": null,
    "RESUS VOL": null,
    "CALC CONC": null,
    "FINAL VOL": null,
    "FINAL CONC": null,
    "TS/DOSE": null,
    "TPMS/DOSE PT": null,
    "STRAW SIZE": null,
    "DOSE VOL": null,
    "#STRAWS/DOSE": null,
    "#STRAWS": null,
    "#DOSES": null,
    "COLOR CODE": null,
    "LOT #": null,
    "TIME IN FREEZER": null
}


function App() {
    const toast = useRef(null);
    const fileUploadRef = useRef(null);
    const [files, setFiles] = useState({})
    
    const onTemplateSelect = (e) => {
        let files = e.files;

        Object.keys(files).forEach((key) => {
        });
    };

    //custom handle for "uploading"
    const onTemplateUpload = (e) => {
        const uploading = {}
        e.files.forEach((file) => {
          uploading[file.name] = file.objectURL.slice(5)
        });
        setFiles({...files,...uploading})
        handlePDFFormValues({...files,...uploading})
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    };

    //grab forms and their field values. then send values to excel creator
    const handlePDFFormValues = async (files) => {
        const toExcelContents = []
        Object.keys(files).forEach(async (file) => {
            let fileValues = {}
            const arrayBuffer = await fetch(files[file]).then(res => res.arrayBuffer())
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const form = pdfDoc.getForm();

            const formFields = form.getFields()
            formFields.forEach(field => {
                const fieldName = field.getName()
                const textField = form.getTextField(field)
                fileValues[fieldName] = textField.getText()
            })
            fileValues = Object.apply(templateObject,fileValues)
            toExcelContents.push(fileValues)
        })
    }


    const handleRemove = (file, callback) => {
        const toUpdate = files;
        delete toUpdate[file.name]
        setFiles(toUpdate)
        callback()
    };

    const handleCancel = () => {
      setFiles({})
    }

    const headerTemplate = (options) => {
        const { className, chooseButton, uploadButton, cancelButton } = options;

        return (
            <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
                {chooseButton}
                {uploadButton}
                {cancelButton}
            </div>
        );
    };

    const itemTemplate = (file, props) => {
        return (
            <div className="flex align-items-center flex-wrap">
                <div className="flex align-items-center" style={{ width: '40%' }}>
                    <img alt={file.name} role="presentation" src={file.objectURL} width={100} />
                    <span className="flex flex-column text-left ml-3">
                        {file.name}
                        <small>{new Date().toLocaleDateString()}</small>
                    </span>
                </div>
                <Tag value={props.formatSize} severity="warning" className="px-3 py-2" />
                <Button type="button" icon="pi pi-times" className="p-button-outlined p-button-rounded p-button-danger ml-auto" onClick={() => handleRemove(file, props.onRemove)} />
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center flex-column">
                <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
                <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                    Drag and Drop Image Here
                </span>
            </div>
        );
    };

    const chooseOptions = { icon: 'pi pi-fw pi-images', iconOnly: true, className: 'custom-choose-btn p-button-rounded p-button-outlined' };
    const uploadOptions = { icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined' };
    const cancelOptions = { icon: 'pi pi-fw pi-times', iconOnly: true, className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined' };

    return (
        <div>
            <Toast ref={toast}></Toast>

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
            <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

            <FileUpload ref={fileUploadRef} name="file-upload" multiple onSelect={onTemplateSelect} customUpload={true} uploadHandler={onTemplateUpload}
                headerTemplate={headerTemplate} itemTemplate={itemTemplate} emptyTemplate={emptyTemplate} onClear={handleCancel}
                chooseOptions={chooseOptions} uploadOptions={uploadOptions} cancelOptions={cancelOptions} />
        </div>
    )
}

export default App;
