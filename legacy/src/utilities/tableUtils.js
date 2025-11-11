import { SearchOutlined } from "@ant-design/icons";
import Search from "antd/es/transfer/search";


export const getColumnSearchProps = (dataIndex, fieldName, setSearchText, setSearchedColumn) => ({
    filterIcon: (filtered) => (
        <SearchOutlined
            style={{
                color: filtered ? '#1677ff' : undefined,
            }}
        />
    ),
    onFilter: (value, record) => {
        return (record[dataIndex]?record[dataIndex]:"").toString().toLowerCase().includes(value.toLowerCase())
    },
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
        return <Search
            placeholder={`${fieldName}`}
            allowClear
            onSearch={(e) => { }}
            onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : [])
                setSearchText(e.target.value);
                setSearchedColumn(dataIndex);
                confirm({
                    closeDropdown: false,
                });
            }}
            style={{
                width: 304,
            }}
        />
    },
    render: (text) => { return text },
});


