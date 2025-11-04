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
  province_id: string;
  province_name: string;
  province_type: string;
}

interface District {
  district_id: string;
  district_name: string;
  district_type: string;
  province_id: string;
}

interface Ward {
  ward_id: string;
  ward_name: string;
  ward_type: string;
  district_id: string;
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
    fetch("https://vapi.vnappmob.com/api/province/")
      .then((res) => res.json())
      .then((data) => setProvinces(data.results || []))
      .catch((err) => console.error("Failed to fetch provinces:", err));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://vapi.vnappmob.com/api/province/district/${selectedProvince.province_id}`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(data.results || []);
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
      fetch(`https://vapi.vnappmob.com/api/province/ward/${selectedDistrict.district_id}`)
        .then((res) => res.json())
        .then((data) => {
          setWards(data.results || []);
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
      selectedWard?.ward_name,
      selectedDistrict?.district_name,
      selectedProvince?.province_name,
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
            value={selectedProvince?.province_id || ""}
            onChange={(e) => {
              const province = provinces.find((p) => p.province_id === e.target.value);
              setSelectedProvince(province || null);
            }}
            required={required}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((province) => (
              <option key={province.province_id} value={province.province_id}>
                {province.province_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-sm">Quận/Huyện *</Label>
          <select
            id="district"
            value={selectedDistrict?.district_id || ""}
            onChange={(e) => {
              const district = districts.find((d) => d.district_id === e.target.value);
              setSelectedDistrict(district || null);
            }}
            required={required}
            disabled={!selectedProvince}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.district_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ward" className="text-sm">Phường/Xã *</Label>
          <select
            id="ward"
            value={selectedWard?.ward_id || ""}
            onChange={(e) => {
              const ward = wards.find((w) => w.ward_id === e.target.value);
              setSelectedWard(ward || null);
            }}
            required={required}
            disabled={!selectedDistrict}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.ward_id} value={ward.ward_id}>
                {ward.ward_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
