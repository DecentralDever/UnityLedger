import { jsx as _jsx } from "react/jsx-runtime";
const ProgressBar = ({ progress }) => {
    return (_jsx("div", { style: { width: "100%", background: "#eee", borderRadius: "4px", marginBottom: "1rem" }, children: _jsx("div", { style: {
                width: `${progress}%`,
                background: "#09f",
                height: "8px",
                borderRadius: "4px",
                transition: "width 0.3s ease"
            } }) }));
};
export default ProgressBar;
