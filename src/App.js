import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import { PDFDocument } from 'pdf-lib'
import {utils, writeFile} from 'xlsx'

const ipcRenderer = window.require("electron").ipcRenderer;


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
    "TIME IN FREEZER": null,
    "STORAGE LOCATION 1": null,
    "NO STRAWS": null,
    "NO. DOSES": null,
    "TANK": null,
    "CANISTER": null,
    "PIE": null,
    "TOP/BOTTOM": null,
    "STORAGE LOCATION 2": null,
    "LOC 2 NO STRAWS": null,
    "LOC 2 NO. DOSES": null,
    "LOC 2 TANK": null,
    "LOC 2 CANISTER": null,
    "LOC 2 PIE": null,
    "LOC 2 TOP/BOTTOM": null,
    "STORAGE LOCATION 3": null,
    "LOC 3 NO STRAWS": null,
    "LOC 3 NO DOSES": null,
    "LOC 3 TANK": null,
    "LOC 3 CANISTER": null,
    "LOC 3 PIE": null,
    "LOC 3 TOP/BOTTOM": null,
    "EVA +/-": null,
    "CULTURE": null,
    "MORPHOLOGY": null,
    "EXPORT QUAL": null,
    "EU": null,
    "A": null,
    "NZ": null,
    "OTHER": null
}

const checkVals = ['STALLION OWNER', 'FACILITY', 'AGE','CONC DENS','TOTAL SPERM', 'CONC NC', "BREED", "REGISTRATION"]


function App() {
    const toast = useRef(null);
    const fileUploadRef = useRef(null);
    const [files, setFiles] = useState({})
    const [toUpload, setToUpload] = useState([Object.keys(templateObject)])
    
    const onTemplateSelect = async (e) => {
        let files = e.files;
        Object.keys(files).forEach((key) => {

        });
    };

    //custom handle for "uploading"
    const onTemplateUpload = (e) => {
        const uploading = {}
        
        e.files.forEach((file) => {
            console.log(file)
          uploading[file.name] = file.path
        });
        setFiles({...files,...uploading})
        handlePDFFormValues({...files,...uploading})
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    };


    //grab forms and their field values. then send values to excel creator
    const handlePDFFormValues = async (files) => {
        let toExcelContents = toUpload
        Object.keys(files).forEach(async (file, i) => {
            console.log("running")
            const container = []
            const fileValues = new Map(Object.entries(templateObject))
            const arrayBuffer = await ipcRenderer.invoke("path-to-buffer", files[file])
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const form = pdfDoc.getForm();

            const formFields = form.getFields()
            formFields.forEach(field => {
                const fieldName = field.getName()
                if(!(checkVals.includes(fieldName))){
                    const textField = form.getTextField(fieldName)
                    fileValues.set(fieldName,textField.getText())
                }
            })

            let escape = false;
            const iterator = fileValues.values()
            while(!escape){
                const target = iterator.next()
                if(target.done){
                    escape = true
                } else {
                    container.push(target.value)
                }
            }
            console.log(container)
            toExcelContents.push(container)   
            if(Object.keys(files).length === i+1){
                handleXLSXCreation(toExcelContents)
            }             
        })     
    }



    const handleXLSXCreation = (x) => {
        console.log(toUpload)
        const worksheet = utils.aoa_to_sheet(x, {origin: "A1"});
        console.log(toUpload)
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Freeze Sheets");
        // const max_width = toUpload[0].reduce((w, r) => Math.max(w, r.length), 20);
        // worksheet["!cols"] = [ { wch: max_width } ];
        writeFile(workbook, "Master Freeze Sheet.xlsx", { compression: true });
        setToUpload([Object.keys(templateObject)])
    }

    const handleRemove = (file, callback) => {
        const toUpdate = files;
        delete toUpdate[file.name]
        setFiles(toUpdate)
        setToUpload([Object.keys(templateObject)])
        callback()
    };

    const handleCancel = () => {
      setFiles({})
      setToUpload([Object.keys(templateObject)])
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
                <div className="flex align-items-center" style={{ width: '60%' }}>
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
