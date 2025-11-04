"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

interface Province {
  name: string;
  code: number;
}

interface District {
  name: string;
  code: number;
}

interface Ward {
  name: string;
  code: number;
}

export function AddressAutocomplete({ onChange, required = false }: AddressAutocompleteProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [streetAddress, setStreetAddress] = useState("");

  // Fetch provinces on mount
  useEffect(() => {
    fetch("http://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Failed to fetch provinces:", err));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`http://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(data.districts || []);
          setSelectedDistrict(null);
          setWards([]);
          setSelectedWard(null);
        })
        .catch((err) => console.error("Failed to fetch districts:", err));
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`http://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setWards(data.wards || []);
          setSelectedWard(null);
        })
        .catch((err) => console.error("Failed to fetch wards:", err));
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // Update full address when any part changes
  useEffect(() => {
    const parts = [
      streetAddress,
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean);

    onChange(parts.join(", "));
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="streetAddress" className="text-sm">Số nhà, tên đường *</Label>
        <Input
          id="streetAddress"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required={required}
          placeholder="123 Lê Lợi"
          className="h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="province" className="text-sm">Tỉnh/Thành phố *</Label>
          <select
            id="province"
            value={selectedProvince?.code || ""}
            onChange={(e) => {
              const province = provinces.find((p) => p.code === Number(e.target.value));
              setSelectedProvince(province || null);
            }}
            required={required}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-sm">Quận/Huyện *</Label>
          <select
            id="district"
            value={selectedDistrict?.code || ""}
            onChange={(e) => {
              const district = districts.find((d) => d.code === Number(e.target.value));
              setSelectedDistrict(district || null);
            }}
            required={required}
            disabled={!selectedProvince}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ward" className="text-sm">Phường/Xã *</Label>
          <select
            id="ward"
            value={selectedWard?.code || ""}
            onChange={(e) => {
              const ward = wards.find((w) => w.code === Number(e.target.value));
              setSelectedWard(ward || null);
            }}
            required={required}
            disabled={!selectedDistrict}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
