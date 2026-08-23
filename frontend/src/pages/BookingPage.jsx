import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import addressService from '../services/address.service';
import availabilityService from '../services/availability.service';
import catalogService from '../services/catalog.service';
import orderService from '../services/order.service';

function toDateValue(value) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [service, setService] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    serviceId: searchParams.get('serviceId') || location.state?.serviceId || '',
    addressId: '',
    type: 'cleaning',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const selectedServiceId = form.serviceId || searchParams.get('serviceId');
        const [addressData, serviceData] = await Promise.all([
          addressService.list(),
          selectedServiceId ? catalogService.getServiceById(selectedServiceId) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setAddresses(addressData || []);
        setService(serviceData);
        if (serviceData?.provider?.id && form.scheduled_date) {
          const slotData = await availabilityService.getSlots(serviceData.provider.id, form.scheduled_date);
          if (isMounted) setSlots(slotData || []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError?.message || 'Unable to load the booking details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [form.serviceId, searchParams]);

  const providerId = service?.provider?.id || service?.provider_id;

  useEffect(() => {
    if (!providerId || !form.scheduled_date) {
      setSlots([]);
      return;
    }

    let isMounted = true;
    const loadSlots = async () => {
      try {
        const nextSlots = await availabilityService.getSlots(providerId, form.scheduled_date);
        if (isMounted) setSlots(nextSlots || []);
      } catch (_loadError) {
        if (isMounted) setSlots([]);
      }
    };

    loadSlots();
    return () => { isMounted = false; };
  }, [providerId, form.scheduled_date]);

  const slotOptions = useMemo(() => {
    if (!slots.length) return [];
    return slots.map((slot) => ({ value: slot.start_time || slot.time || slot.slot, label: slot.label || `${slot.start_time || slot.time || 'slot'} - ${slot.end_time || ''}` }));
  }, [slots]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!service || !form.addressId) {
      setError('Please select a service and a delivery address.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        provider_id: service.provider?.id || service.provider_id,
        address_id: Number(form.addressId),
        type: form.type,
        scheduled_date: toDateValue(form.scheduled_date),
        scheduled_time: form.scheduled_time,
        notes: form.notes,
        items: [{
          service_id: service.id,
          quantity: 1,
          attributes_json: { service_type: service.type || 'one_time' },
        }],
      };

      const result = await orderService.create(payload);
      setSuccess('Order created successfully.');
      if (result?.id) {
        setTimeout(() => navigate('/customer/orders'), 600);
      }
    } catch (submitError) {
      setError(submitError?.message || 'Unable to create the booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton lines={6} />;
  if (!service) return <EmptyState title="No service selected" description="Choose a service before starting the booking flow." />;

  return (
    <div className="page page--booking">
      <Card title="Book service" subtitle="Confirm the service, time, and delivery details.">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Selected service</span>
            <input className="field__input" value={service.name} readOnly />
          </label>

          <label className="field">
            <span className="field__label">Service type</span>
            <select className="field__input" name="type" value={form.type} onChange={handleChange}>
              <option value="cleaning">Cleaning</option>
              <option value="water">Water</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">Preferred delivery date</span>
            <input className="field__input" type="date" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} required />
          </label>

          <label className="field">
            <span className="field__label">Preferred time</span>
            <select className="field__input" name="scheduled_time" value={form.scheduled_time} onChange={handleChange} required>
              <option value="">Select a time</option>
              {slotOptions.length ? slotOptions.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              )) : <option value="09:00">09:00</option>}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Address</span>
            <select className="field__input" name="addressId" value={form.addressId} onChange={handleChange} required>
              <option value="">Select an address</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>{address.label || `${address.area}, ${address.city}`}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Notes</span>
            <textarea className="field__input field__input--textarea" name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Any access instructions or service notes" />
          </label>

          {error ? <p className="form__error">{error}</p> : null}
          {success ? <p className="form__success">{success}</p> : null}

          <Button type="submit" loading={submitting} disabled={submitting}>
            Continue booking
          </Button>
        </form>
      </Card>
    </div>
  );
}
