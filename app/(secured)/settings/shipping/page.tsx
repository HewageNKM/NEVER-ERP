"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Switch,
  message,
  Space,
  Popconfirm,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { ShippingRule } from "@/model/ShippingRule";

const ShippingSettingsPage = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [form] = Form.useForm();

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/shipping-rules");
      if (res.ok) {
        const data = await res.json();
        // Sort by minWeight
        data.sort(
          (a: ShippingRule, b: ShippingRule) => a.minWeight - b.minWeight
        );
        setRules(data);
      } else {
        message.error("Failed to fetch shipping rules");
      }
    } catch (error) {
      console.error(error);
      message.error("Error fetching rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (rule: ShippingRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/shipping-rules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        message.success("Rule deleted");
        fetchRules();
      } else {
        message.error("Failed to delete rule");
      }
    } catch (error) {
      message.error("Error deleting rule");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        minWeight: Number(values.minWeight),
        maxWeight: Number(values.maxWeight),
        rate: Number(values.rate),
      };

      if (editingRule) {
        const res = await fetch(`/api/v1/shipping-rules/${editingRule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          message.success("Rule updated");
        } else {
          throw new Error("Failed to update");
        }
      } else {
        const res = await fetch("/api/v1/shipping-rules", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          message.success("Rule created");
        } else {
          throw new Error("Failed to create");
        }
      }
      setIsModalVisible(false);
      fetchRules();
    } catch (error) {
      console.error(error);
      message.error("Operation failed");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Weight Range (kg)",
      key: "range",
      render: (_: any, record: ShippingRule) => (
        <span>
          {record.minWeight} - {record.maxWeight} kg
        </span>
      ),
    },
    {
      title: "Rate (LKR)",
      dataIndex: "rate",
      key: "rate",
      render: (val: number) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active: boolean) => (
        <span className={active ? "text-green-600 font-bold" : "text-gray-400"}>
          {active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShippingRule) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipping Rates</h1>
          <p className="text-gray-500">
            Manage dynamic shipping rates based on weight.
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add New Rule
        </Button>
      </div>

      <Table
        dataSource={rules}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. Standard Small Package" />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="minWeight"
              label="Min Weight (kg)"
              className="flex-1"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                step={0.1}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="maxWeight"
              label="Max Weight (kg)"
              className="flex-1"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                step={0.1}
                placeholder="100"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="rate"
            label="Shipping Rate (LKR)"
            rules={[{ required: true, message: "Please enter the rate" }]}
          >
            <InputNumber
              className="w-full"
              prefix="Rs."
              min={0}
              placeholder="350"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShippingSettingsPage;
